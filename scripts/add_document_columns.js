const { pool } = require('../Config/dbConfig');

const updateDatabase = async () => {
    try {
        console.log('Adding document columns to users table...');

        const alterTableQuery = `
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS document_resume VARCHAR(255),
            ADD COLUMN IF NOT EXISTS document_test_paper VARCHAR(255),
            ADD COLUMN IF NOT EXISTS document_10th VARCHAR(255),
            ADD COLUMN IF NOT EXISTS document_12th VARCHAR(255),
            ADD COLUMN IF NOT EXISTS document_ug VARCHAR(255),
            ADD COLUMN IF NOT EXISTS document_pg VARCHAR(255),
            ADD COLUMN IF NOT EXISTS document_aadhar VARCHAR(255),
            ADD COLUMN IF NOT EXISTS document_pan VARCHAR(255),
            ADD COLUMN IF NOT EXISTS document_passbook VARCHAR(255),
            ADD COLUMN IF NOT EXISTS document_photo VARCHAR(255),
            ADD COLUMN IF NOT EXISTS document_relieving_letter VARCHAR(255),
            ADD COLUMN IF NOT EXISTS document_exp_letter VARCHAR(255),
            ADD COLUMN IF NOT EXISTS document_payslips VARCHAR(255),
            ADD COLUMN IF NOT EXISTS document_emp_details_form VARCHAR(255);
        `;

        await pool.execute(alterTableQuery);
        console.log('Document columns added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error updating database schema:', error);
        process.exit(1);
    }
};

updateDatabase();
