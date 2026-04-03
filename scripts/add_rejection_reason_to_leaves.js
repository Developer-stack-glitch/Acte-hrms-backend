const { pool } = require('../Config/dbConfig');

const updateDatabase = async () => {
    try {
        console.log('Adding rejection_reason column to leaves table...');

        const alterTableQuery = `
            ALTER TABLE leaves 
            ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL;
        `;

        await pool.execute(alterTableQuery);
        console.log('rejection_reason column added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error updating database schema:', error);
        process.exit(1);
    }
};

updateDatabase();
