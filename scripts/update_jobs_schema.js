const { pool } = require('../Config/dbConfig');

async function migrate() {
    try {
        console.log('Updating jobs table schema...');

        const columnsToAdd = [
            { name: 'contact_email', type: 'VARCHAR(100)' },
            { name: 'contact_phone', type: 'VARCHAR(20)' },
            { name: 'experience_years', type: 'INT' },
            { name: 'min_salary', type: 'DECIMAL(10,2)' },
            { name: 'max_salary', type: 'DECIMAL(10,2)' },
            { name: 'skills', type: 'TEXT' }, // Store as JSON string or comma-separated
            { name: 'branch', type: 'VARCHAR(100)' },
            { name: 'num_positions', type: 'INT DEFAULT 1' },
            { name: 'preferred_gender', type: 'VARCHAR(50) DEFAULT "Any"' },
            { name: 'close_date', type: 'DATE' },
            { name: 'hiring_manager', type: 'VARCHAR(100)' },
            { name: 'recruiters', type: 'TEXT' },
            { name: 'city', type: 'VARCHAR(100)' },
            { name: 'state', type: 'VARCHAR(100)' },
            { name: 'zip_code', type: 'VARCHAR(20)' }
        ];

        for (const col of columnsToAdd) {
            try {
                await pool.execute(`ALTER TABLE jobs ADD COLUMN ${col.name} ${col.type}`);
                console.log(`Added column: ${col.name}`);
            } catch (err) {
                if (err.code === 'ER_DUP_COLUMN_NAME') {
                    console.log(`Column ${col.name} already exists.`);
                } else {
                    console.error(`Error adding column ${col.name}:`, err.message);
                }
            }
        }

        console.log('Jobs table schema update completed.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
