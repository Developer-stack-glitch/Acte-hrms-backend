const { pool } = require('../Config/dbConfig');

const updateDatabase = async () => {
    try {
        console.log('Adding team_lead_id column to leaves table...');

        const alterTableQuery = `
            ALTER TABLE leaves 
            ADD COLUMN IF NOT EXISTS team_lead_id INT NULL,
            ADD CONSTRAINT fk_team_lead FOREIGN KEY (team_lead_id) REFERENCES users(id) ON DELETE SET NULL;
        `;

        await pool.execute(alterTableQuery);
        console.log('team_lead_id column added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error updating database schema:', error);
        process.exit(1);
    }
};

updateDatabase();
