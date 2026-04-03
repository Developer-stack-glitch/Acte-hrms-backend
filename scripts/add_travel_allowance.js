const { pool } = require('../Config/dbConfig');

async function updateSchema() {
    try {
        console.log('Adding travel_allowance column to users table...');
        await pool.execute('ALTER TABLE users ADD COLUMN travel_allowance DECIMAL(15, 2) DEFAULT 0.00');
        console.log('Travel allowance column added successfully');
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
            console.log('Travel allowance column already exists');
            process.exit(0);
        } else {
            console.error('Error updating schema:', err.message);
            process.exit(1);
        }
    }
}

updateSchema();
