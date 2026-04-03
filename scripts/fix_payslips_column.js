const { pool } = require('../Config/dbConfig');

const updateColumn = async () => {
    try {
        console.log('Updating document_payslips column to TEXT...');

        const alterTableQuery = `
            ALTER TABLE users 
            MODIFY COLUMN document_payslips TEXT;
        `;

        await pool.execute(alterTableQuery);
        console.log('Column updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error updating column:', error);
        process.exit(1);
    }
};

updateColumn();
