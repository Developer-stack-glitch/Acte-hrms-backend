const { pool } = require('../Config/dbConfig');

async function updateSchema() {
    try {
        console.log('Adding travel_allowance_pay column to payroll_items table...');
        await pool.execute('ALTER TABLE payroll_items ADD COLUMN travel_allowance_pay DECIMAL(15, 2) DEFAULT 0.00');
        console.log('travel_allowance_pay column added successfully to payroll_items');
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
            console.log('travel_allowance_pay column already exists in payroll_items');
            process.exit(0);
        } else {
            console.error('Error updating schema:', err.message);
            process.exit(1);
        }
    }
}

updateSchema();
