const { pool } = require('../Config/dbConfig');

async function checkCompaniesTable() {
    try {
        const [rows] = await pool.execute('SELECT COUNT(*) as count FROM companies');
        console.log(`Count in companies table: ${rows[0].count}`);
        process.exit(0);
    } catch (error) {
        console.error('Check failed:', error);
        process.exit(1);
    }
}

checkCompaniesTable();
