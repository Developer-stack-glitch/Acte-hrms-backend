const { pool } = require('../Config/dbConfig');

async function emptyPayrollRuns() {
    try {
        console.log('Starting emptying of payroll_runs and payroll_items tables...');

        // Disable foreign key checks
        await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
        console.log('Foreign key checks disabled');

        // Truncate tables
        const tables = ['payroll_items', 'payroll_runs'];

        for (const table of tables) {
            await pool.execute(`TRUNCATE TABLE ${table}`);
            console.log(`Truncated table: ${table}`);
        }

        // Re-enable foreign key checks
        await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Foreign key checks re-enabled');

        console.log('Payroll tables emptied successfully');
        process.exit(0);
    } catch (error) {
        console.error('Emptying failed:', error);
        // Make sure to re-enable checks even if it fails
        try {
            await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
        } catch (e) {
            console.error('Failed to re-enable foreign key checks:', e.message);
        }
        process.exit(1);
    }
}

emptyPayrollRuns();
