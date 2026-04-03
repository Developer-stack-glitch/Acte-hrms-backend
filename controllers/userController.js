const User = require('../models/userModel');
const { pool } = require('../Config/dbConfig');

const createUser = async (req, res) => {
    try {
        const userData = { ...req.body };

        // Normalize booleans from FormData (strings like "true"/"false" to 1/0)
        Object.keys(userData).forEach(key => {
            if (key === 'team_lead') {
                userData[key] = (userData[key] === 'true' || userData[key] === 1 || userData[key] === true) ? 'yes' : 'no';
            } else {
                if (userData[key] === 'true') userData[key] = 1;
                if (userData[key] === 'false') userData[key] = 0;
            }
        });

        // Automatically set company from logged in user (not chooseable)
        if (req.user && req.user.company) {
            userData.company = req.user.company;
        }

        // Handle file uploads if present
        if (req.files) {
            Object.keys(req.files).forEach(key => {
                const files = req.files[key];
                // Map frontend names like 'aadhar_file' to DB 'document_aadhar'
                const baseName = key.replace('_file', '');
                const dbKey = `document_${baseName}`;

                if (files.length > 1 || key === 'payslips') {
                    userData[dbKey] = JSON.stringify(files.map(f => f.path));
                } else {
                    userData[dbKey] = files[0].path;
                }
            });
        }


        // 3. Prevent duplicate Employee ID or Biometric ID
        if (userData.emp_id) {
            const [existingEmpId] = await pool.execute('SELECT id FROM users WHERE emp_id = ?', [userData.emp_id]);
            if (existingEmpId.length > 0) {
                return res.status(400).json({ message: `Employee ID "${userData.emp_id}" is already assigned to another staff.` });
            }
        }

        if (userData.biometric_id) {
            const [existingBioId] = await pool.execute('SELECT id FROM users WHERE biometric_id = ?', [userData.biometric_id]);
            if (existingBioId.length > 0) {
                return res.status(400).json({ message: `Biometric ID "${userData.biometric_id}" is already assigned to another staff.` });
            }
        }

        // Restriction: Only one Team Lead per department
        if (userData.team_lead === 'yes' && userData.department) {
            const [existingLead] = await pool.execute(
                'SELECT employee_name FROM users WHERE department = ? AND team_lead = "yes"',
                [userData.department]
            );
            if (existingLead.length > 0) {
                return res.status(400).json({
                    message: `Department already has a Team Lead: ${existingLead[0].employee_name}. Only one Team Lead is allowed per department.`
                });
            }
        }

        const userId = await User.create(userData);
        res.status(201).json({ message: 'User created successfully', userId });
    } catch (error) {
        console.error('Error creating user:', error);
        let message = 'Error creating user';
        if (error.code === 'ER_DUP_ENTRY') {
            if (error.message.includes('email')) message = 'This email address is already registered please change the email address.';
            else if (error.message.includes('emp_id')) message = 'This Employee ID is already in use.';
            else if (error.message.includes('biometric_id')) message = 'This Biometric ID is already in use.';
            else message = 'The record already exists.';
            return res.status(400).json({ message, error: error.message });
        }
        res.status(500).json({ message, error: error.message });
    }
};

const getMilestones = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT 
                u.id, 
                u.employee_name, 
                u.dob, 
                u.doj, 
                d.name as department_name
            FROM users u
            LEFT JOIN departments d ON u.department = d.id
            WHERE u.role != 'superadmin'
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching milestones:', error);
        res.status(500).json({ message: 'Error fetching milestones', error: error.message });
    }
};

const getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', ...queryFilters } = req.query;
        const userRole = req.user.role;
        const userId = req.user.id;

        // Normalize keys (remove [] if present) and remove pagination/search params
        const filters = {};
        Object.keys(queryFilters).forEach(key => {
            const cleanKey = key.replace('[]', '');
            if (!['page', 'limit', 'search'].includes(cleanKey)) {
                filters[cleanKey] = queryFilters[key];
            }
        });

        // Security: If employee, they can only "get" themselves
        if (userRole === 'employee') {
            const result = await User.findById(userId);
            return res.status(200).json({
                users: result ? [result] : [],
                total: result ? 1 : 0
            });
        }

        const result = await User.getPaginated(parseInt(page), parseInt(limit), search, filters);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

const getUserAttendance = async (req, res) => {
    try {
        const { ...queryFilters } = req.query;
        const userRole = req.user.role;
        const userId = req.user.id;

        const filters = {};
        Object.keys(queryFilters).forEach(key => {
            const cleanKey = key.replace('[]', '');
            filters[cleanKey] = queryFilters[key];
        });

        if (userRole === 'employee') {
            const user = await User.findById(userId);
            return res.status(200).json([user]);
        }

        const result = await User.getUserAttendance(filters);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching user attendance:', error);
        res.status(500).json({ message: 'Error fetching user attendance', error: error.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userData = { ...req.body };

        // Normalize booleans from FormData (strings like "true"/"false" to 1/0)
        Object.keys(userData).forEach(key => {
            if (key === 'team_lead') {
                userData[key] = (userData[key] === 'true' || userData[key] === 1 || userData[key] === true) ? 'yes' : 'no';
            } else {
                if (userData[key] === 'true') userData[key] = 1;
                if (userData[key] === 'false') userData[key] = 0;
            }
        });

        // Handle existing files and new uploads
        // First, check for any existing files sent back
        Object.keys(userData).forEach(key => {
            if (key.endsWith('_existing')) {
                const realKey = key.replace('_existing', '');
                const baseName = realKey.replace('_file', '');
                const dbKey = `document_${baseName}`;
                userData[dbKey] = userData[key];
                delete userData[key];
            } else if (key.endsWith('_existing[]')) {
                const realKey = key.replace('_existing[]', '');
                const baseName = realKey.replace('_file', '');
                const dbKey = `document_${baseName}`;
                // For arrays, ensure it's normalized
                let existing = userData[key];
                if (!Array.isArray(existing)) existing = [existing];
                userData[dbKey] = existing;
                delete userData[key];
            }
        });

        if (req.files) {
            Object.keys(req.files).forEach(key => {
                const files = req.files[key];
                const baseName = key.replace('_file', '');
                const dbKey = `document_${baseName}`;
                const newPaths = files.map(f => f.path);

                if (key === 'payslips') {
                    // Merge new payslips with existing ones
                    const existing = Array.isArray(userData[dbKey]) ? userData[dbKey] :
                        (typeof userData[dbKey] === 'string' && userData[dbKey].startsWith('[') ? JSON.parse(userData[dbKey]) : []);
                    userData[dbKey] = JSON.stringify([...existing, ...newPaths]);
                } else {
                    userData[dbKey] = newPaths[0];
                }
            });
        }

        // 3. Prevent duplicate Employee ID or Biometric ID (excluding current user)
        if (userData.emp_id) {
            const [existingEmpId] = await pool.execute('SELECT id FROM users WHERE emp_id = ? AND id != ?', [userData.emp_id, id]);
            if (existingEmpId.length > 0) {
                return res.status(400).json({ message: `Employee ID "${userData.emp_id}" is already assigned to another staff.` });
            }
        }

        if (userData.biometric_id) {
            const [existingBioId] = await pool.execute('SELECT id FROM users WHERE biometric_id = ? AND id != ?', [userData.biometric_id, id]);
            if (existingBioId.length > 0) {
                return res.status(400).json({ message: `Biometric ID "${userData.biometric_id}" is already assigned to another staff.` });
            }
        }

        // Restriction: Only one Team Lead per department
        if (userData.team_lead === 'yes' && userData.department) {
            const [existingLead] = await pool.execute(
                'SELECT employee_name FROM users WHERE department = ? AND team_lead = "yes" AND id != ?',
                [userData.department, id]
            );
            if (existingLead.length > 0) {
                return res.status(400).json({
                    message: `Department already has a Team Lead: ${existingLead[0].employee_name}. Only one Team Lead is allowed per department.`
                });
            }
        }

        const affectedRows = await User.update(id, userData);
        if (affectedRows === 0) {
            return res.status(404).json({ message: 'User not found or no changes made' });
        }
        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        let message = 'Error updating user';
        if (error.code === 'ER_DUP_ENTRY') {
            if (error.message.includes('email')) message = 'This email address is already registered.';
            else if (error.message.includes('emp_id')) message = 'This Employee ID is already in use.';
            else if (error.message.includes('biometric_id')) message = 'This Biometric ID is already in use.';
            else message = 'The record already exists.';
            return res.status(400).json({ message, error: error.message });
        }
        res.status(500).json({ message, error: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const affectedRows = await User.delete(id);
        if (affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};

module.exports = {
    createUser,
    getUsers,
    getUserById,
    getProfile,
    updateUser,
    deleteUser,
    getMilestones,
    getUserAttendance
};
