const { pool } = require('../Config/dbConfig');

async function verifyUsers() {
    try {
        const [rows] = await pool.execute('SELECT id, employee_name, role FROM users');
        console.log('Current users:');
        console.table(rows);
        process.exit(0);
    } catch (error) {
        console.error('Check failed:', error);
        process.exit(1);
    }
}

verifyUsers();
