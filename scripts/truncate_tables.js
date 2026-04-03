const { pool } = require('../Config/dbConfig');

async function truncateTables() {
    try {
        console.log('Starting truncation of tables...');

        // Disable foreign key checks
        await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
        console.log('Foreign key checks disabled');

        // Truncate tables
        const tables = ['branches', 'companies', 'designations', 'shifts'];

        for (const table of tables) {
            await pool.execute(`TRUNCATE TABLE ${table}`);
            console.log(`Truncated table: ${table}`);
        }

        // Re-enable foreign key checks
        await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Foreign key checks re-enabled');

        console.log('All tables truncated successfully');
        process.exit(0);
    } catch (error) {
        console.error('Truncation failed:', error);
        // Make sure to re-enable checks even if it fails
        await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
        process.exit(1);
    }
}

truncateTables();
