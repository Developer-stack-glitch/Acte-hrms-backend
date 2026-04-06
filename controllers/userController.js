const { User, USER_COLUMNS } = require('../models/userModel');
const SalaryStructure = require('../models/salaryStructureModel');
const Organization = require('../models/organizationModel');
const { pool } = require('../Config/dbConfig');
const ExcelJS = require('exceljs');
const fs = require('fs');

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


        // 3. Validate mandatory fields
        const mandatoryFields = ['department', 'designation', 'branch', 'shift'];
        for (const field of mandatoryFields) {
            if (!userData[field]) {
                const label = field.charAt(0).toUpperCase() + field.slice(1);
                return res.status(400).json({ message: `${label} is mandatory.` });
            }
        }

        // 4. Prevent duplicate Employee ID or Biometric ID
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

        // 3. Validate mandatory fields (only if present in request, to allow partial updates like password/photo)
        const mandatoryFields = ['department', 'designation', 'branch', 'shift'];
        for (const field of mandatoryFields) {
            if (Object.keys(userData).includes(field) && !userData[field]) {
                const label = field.charAt(0).toUpperCase() + field.slice(1);
                return res.status(400).json({ message: `${label} is mandatory.` });
            }
        }

        // 4. Prevent duplicate Employee ID or Biometric ID (excluding current user)
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

const downloadBulkTemplate = async (req, res) => {
    try {
        const { salary_structure_id } = req.query;
        if (!salary_structure_id) return res.status(400).json({ message: 'Salary structure ID is required' });

        const structure = await SalaryStructure.getById(salary_structure_id);
        const components = await SalaryStructure.getComponents(salary_structure_id);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Employee Template');

        const baseColumns = [
            'Employee Name', 'Off Mail ID', 'Emp ID', 'Biometric ID', 'Role', 
            'Department ID', 'Designation ID', 'Branch ID', 'Shift ID', 
            'Employment Type ID', 'Work Location ID', 'DOJ (YYYY-MM-DD)', 'DOR (YYYY-MM-DD)',
            'DOB (YYYY-MM-DD)', 'Gender', 'Per Mail ID', 'Off Contact No', 'Per Contact No',
            'ESI No', 'PF No', 'Aadhar No', 'PAN No', 'Bank A/C No', 'IFSC Code', 'UAN',
            'Blood Group', 'Mother Tongue', 'Father/Spouse Name', 'Father/Spouse Contact',
            'Mother Name', 'Mother Contact', 'Temp Address', 'Perm Address',
            'Year Gross Salary'
        ];

        const componentColumns = components.map(c => c.name);
        const allColumns = [...baseColumns, ...componentColumns];

        worksheet.columns = allColumns.map(col => ({ header: col, key: col, width: 20 }));

        // Add dummy data for first row
        const dummyRow = {};
        allColumns.forEach(col => {
            if (col === 'Employee Name') dummyRow[col] = 'John Doe';
            else if (col === 'Off Mail ID') dummyRow[col] = 'john@company.com';
            else if (col === 'Emp ID') dummyRow[col] = 'EMP001';
            else if (col.includes('Date') || col.includes('DOJ') || col.includes('DOB')) dummyRow[col] = '1995-01-01';
            else if (['Role', 'Department ID', 'Designation ID', 'Branch ID', 'Shift ID'].includes(col)) dummyRow[col] = '1';
            else if (col === 'Year Gross Salary') dummyRow[col] = '500000';
            else dummyRow[col] = '';
        });
        worksheet.addRow(dummyRow);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Template_${structure.name.replace(/\s+/g, '_')}.xlsx"`);

        await workbook.xlsx.write(res);
    } catch (error) {
        res.status(500).json({ message: 'Error generating template', error: error.message });
    }
};

const downloadReferenceIds = async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Reference IDs');

        worksheet.columns = [
            { header: 'Type', key: 'type', width: 25 },
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Name', key: 'name', width: 50 }
        ];

        const [departments, designations, branches, shifts, structures, roles, employmentTypes, workLocations] = await Promise.all([
            Organization.getAllDepartments(),
            Organization.getAllDesignations(),
            Organization.getAllBranches(),
            Organization.getAllShifts(),
            SalaryStructure.getAll(req.user.company),
            pool.execute('SELECT DISTINCT role FROM role_permissions').then(([rows]) => rows),
            Organization.getAllEmploymentTypes(),
            Organization.getAllWorkLocations()
        ]);

        const addRows = (type, data, nameKey = 'name') => {
            if (!data || data.length === 0) return;
            data.forEach(item => {
                worksheet.addRow({ 
                    type, 
                    id: item.id || item.role || item.name || 'N/A', 
                    name: item[nameKey] || item.role || item.name || 'N/A'
                });
            });
            worksheet.addRow({}); // Empty row
        };

        addRows('Shift', shifts);
        addRows('Department', departments, 'department_name');
        addRows('Designation', designations);
        addRows('Branch', branches);
        addRows('Salary Structure', structures);
        addRows('Role', roles);
        addRows('Employment Type', employmentTypes);
        addRows('Work Location', workLocations);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="User_Assignment_Reference_IDs.xlsx"');

        await workbook.xlsx.write(res);
    } catch (error) {
        res.status(500).json({ message: 'Error generating reference IDs', error: error.message });
    }
};

const bulkUploadUsers = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const { salary_structure_id } = req.body;

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(req.file.path);
        const worksheet = workbook.getWorksheet(1);

        const rows = [];
        // Helper to extract plain value from ExcelJS cell (handles hyperlinks, rich text, etc.)
        const getCellValue = (value) => {
            if (value === null || value === undefined) return null;
            if (typeof value === 'object') {
                // Hyperlink: { text: '...', hyperlink: '...' }
                if (value.text !== undefined) return value.text;
                // Rich text: { richText: [{ text: '...' }, ...] }
                if (value.richText) return value.richText.map(r => r.text).join('');
                // Date object
                if (value instanceof Date) {
                    return value.toISOString().split('T')[0]; // YYYY-MM-DD
                }
                // Formula result
                if (value.result !== undefined) return value.result;
                return String(value);
            }
            return value;
        };

        const headers = [];
        worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
            headers[colNumber] = getCellValue(cell.value);
        });

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const rowData = {};
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                rowData[headers[colNumber]] = getCellValue(cell.value);
            });
            rows.push(rowData);
        });

        const mapping = {
            'Employee Name': 'employee_name',
            'Off Mail ID': 'off_mail_id',
            'Emp ID': 'emp_id',
            'Biometric ID': 'biometric_id',
            'Role': 'role',
            'Department ID': 'department',
            'Designation ID': 'designation',
            'Branch ID': 'branch',
            'Shift ID': 'shift',
            'Employment Type ID': 'employment_type',
            'Work Location ID': 'work_location',
            'DOJ (YYYY-MM-DD)': 'doj',
            'DOR (YYYY-MM-DD)': 'dor',
            'DOB (YYYY-MM-DD)': 'dob',
            'Gender': 'gender',
            'Per Mail ID': 'per_mail_id',
            'Off Contact No': 'off_contact_no',
            'Per Contact No': 'per_contact_no',
            'ESI No': 'esi',
            'PF No': 'pf',
            'Aadhar No': 'aadhar',
            'PAN No': 'pan',
            'Bank A/C No': 'bank_ac_no',
            'IFSC Code': 'ifsc',
            'UAN': 'uan',
            'Blood Group': 'blood_group',
            'Mother Tongue': 'mother_tongue',
            'Father/Spouse Name': 'father_spouse_name',
            'Father/Spouse Contact': 'father_spouse_contact',
            'Mother Name': 'mother_name',
            'Mother Contact': 'mother_contact',
            'Temp Address': 'temp_address',
            'Perm Address': 'perm_address',
            'Year Gross Salary': 'year_gross_salary'
        };

        const summary = { success: 0, failed: 0, errors: [] };

        for (const rowData of rows) {
            try {
                const userData = {};
                // dynamic mapping (if any headers match USER_COLUMNS)
                Object.keys(rowData).forEach(header => {
                    let value = rowData[header];
                    // Sanitize numeric/ID fields if they have 'N/A'
                    if (value === 'N/A' || value === '') value = null;
                    
                    const normalizedHeader = header.toLowerCase().replace(/\s+/g, '_');
                    if (USER_COLUMNS.includes(normalizedHeader) && userData[normalizedHeader] === undefined) {
                        userData[normalizedHeader] = value;
                    }
                });

                // Set static mapping after dynamic to override if necessary, also sanitizing
                Object.keys(mapping).forEach(header => {
                    let value = rowData[header];
                    if (value === 'N/A' || value === '') value = null;
                    
                    if (value !== undefined) {
                        userData[mapping[header]] = value;
                    }
                });

                // Auto-set company
                userData.company = req.user.company;
                userData.password = 'password123';
                if (salary_structure_id) {
                    userData.salary_structure_id = salary_structure_id;
                }
                if (!userData.employee_name || !userData.off_mail_id) {
                    throw new Error(`Missing mandatory fields for row: ${JSON.stringify(rowData)}`);
                }

                userData.name = userData.employee_name;
                userData.email = userData.off_mail_id;

                await User.create(userData);
                summary.success++;
            } catch (err) {
                summary.failed++;
                summary.errors.push({ row: rowData, message: err.message });
            }
        }

        // Cleanup: remove standard file from disk
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(200).json({ 
            message: `Bulk upload completed. ${summary.success} successful, ${summary.failed} failed.`,
            summary 
        });

    } catch (error) {
        console.error('Bulk upload error:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Error processing bulk upload', error: error.message });
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
    getUserAttendance,
    downloadBulkTemplate,
    downloadReferenceIds,
    bulkUploadUsers
};
