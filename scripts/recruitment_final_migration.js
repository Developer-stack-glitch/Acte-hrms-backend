const { pool } = require('../Config/dbConfig');

async function migrate() {
    try {
        console.log('Finalizing recruitment schema...');

        // 1. Update applicants table status ENUM to include 'Completed'
        await pool.execute(`
            ALTER TABLE applicants 
            MODIFY COLUMN status ENUM('Applied', 'Interviewing', 'Offered', 'Hired', 'Rejected', 'Completed') DEFAULT 'Applied'
        `);
        console.log('Updated applicants status ENUM successfully.');

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
