const { pool } = require('../Config/dbConfig');

const updateDatabase = async () => {
    try {
        console.log('Adding team_lead column to users table...');

        const alterTableQuery = `
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS team_lead VARCHAR(10) DEFAULT 'no';
        `;

        await pool.execute(alterTableQuery);
        console.log('team_lead column added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error updating database schema:', error);
        process.exit(1);
    }
};

updateDatabase();
