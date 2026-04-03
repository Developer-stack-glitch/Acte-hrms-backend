const { pool } = require('../Config/dbConfig');

async function emptyCompaniesTable() {
    try {
        console.log('Starting emptying of companies table...');

        // Disable foreign key checks to prevent issues with dependencies
        await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
        console.log('Foreign key checks disabled');

        // Truncate table
        await pool.execute('TRUNCATE TABLE companies');
        console.log('Truncated table: companies');

        // Re-enable foreign key checks
        await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Foreign key checks re-enabled');

        console.log('Companies table emptied successfully');
        process.exit(0);
    } catch (error) {
        console.error('Emptying failed:', error);
        // Make sure to re-enable checks even if it fails
        try {
            await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
        } catch (e) {
            console.error('Failed to re-enable foreign key checks:', e);
        }
        process.exit(1);
    }
}

emptyCompaniesTable();
