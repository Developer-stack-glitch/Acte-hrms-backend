const { pool } = require('../Config/dbConfig');
const { setupTenantDatabase } = require('../utils/tenantDbSetup');
const Organization = require('../models/organizationModel');

async function addHolidaysTable() {
    try {
        console.log('Starting holidays table creation...');

        // 1. Create table in main database
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS holidays (
                id INT AUTO_INCREMENT PRIMARY KEY,
                company_id INT,
                name VARCHAR(255) NOT NULL,
                date DATE NOT NULL,
                type VARCHAR(50) DEFAULT 'National',
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
            )
        `);
        console.log('Holidays table created in main database');

        // 2. Modify tenantDbSetup.js to include holidays table
        // (I will do this in a separate step using replace_file_content)

        console.log('Holidays table migration prepared successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

addHolidaysTable();
