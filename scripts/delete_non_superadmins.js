const { pool } = require('../Config/dbConfig');

async function cleanupUsers() {
    try {
        console.log('Starting cleanup of users table...');

        // Disable foreign key checks
        await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
        console.log('Foreign key checks disabled');

        // It's safer to delete dependent data first or at the same time
        console.log('Cleaning up related tables...');
        await pool.execute('TRUNCATE TABLE attendance');
        console.log('Truncated table: attendance');
        await pool.execute('TRUNCATE TABLE leaves');
        console.log('Truncated table: leaves');
        await pool.execute('TRUNCATE TABLE biometric_logs');
        console.log('Truncated table: biometric_logs');

        // Delete users who are not superadmins
        const [result] = await pool.execute("DELETE FROM users WHERE role != 'superadmin'");
        console.log(`Deleted ${result.affectedRows} non-superadmin users`);

        // Re-enable foreign key checks
        await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Foreign key checks re-enabled');

        console.log('Users cleanup completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        // Ensure checks are re-enabled
        try {
            await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
        } catch (e) {
            console.error('Failed to re-enable foreign key checks:', e);
        }
        process.exit(1);
    }
}

cleanupUsers();
