const { pool } = require('../Config/dbConfig');

async function updateBatchAllocationsTable() {
    try {
        console.log('Updating batch_allocations table...');

        // Add allocation_day column if it doesn't exist
        await pool.execute(`
            ALTER TABLE batch_allocations 
            ADD COLUMN IF NOT EXISTS allocation_day INT AFTER allocation_date
        `);

        console.log('Column allocation_day added successfully');

        // Migrate data if any
        await pool.execute(`
            UPDATE batch_allocations 
            SET allocation_day = DAY(allocation_date) 
            WHERE allocation_date IS NOT NULL AND allocation_day IS NULL
        `);

        console.log('Data migrated successfully');
        process.exit(0);
    } catch (error) {
        console.error('Update failed:', error);
        process.exit(1);
    }
}

updateBatchAllocationsTable();
