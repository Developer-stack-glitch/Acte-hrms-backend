const { pool } = require('../Config/dbConfig');

const upgradeRoles = async () => {
    try {
        await pool.execute("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'employee', 'superadmin') DEFAULT 'employee'");
        console.log('Roles updated successfully to: admin, employee, superadmin');
        process.exit(0);
    } catch (error) {
        console.error('Error updating roles:', error);
        process.exit(1);
    }
};

upgradeRoles();
