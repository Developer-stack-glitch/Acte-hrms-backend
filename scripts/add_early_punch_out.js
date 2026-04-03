const { pool } = require('../Config/dbConfig');

async function addEarlyPunchOut() {
    try {
        console.log('Adding early_punch_out column to attendance table...');
        await pool.execute('ALTER TABLE attendance ADD COLUMN early_punch_out VARCHAR(10) AFTER late_punch_out');
        console.log('Column added successfully');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists');
            process.exit(0);
        }
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

addEarlyPunchOut();
