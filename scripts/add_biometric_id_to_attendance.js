const { pool } = require('../Config/dbConfig');

async function addBiometricId() {
    try {
        await pool.execute('ALTER TABLE attendance ADD COLUMN biometric_id VARCHAR(50) NULL AFTER status');
        console.log('Successfully added biometric_id column to attendance table');
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('biometric_id column already exists');
        } else {
            console.error('Error adding column:', error);
        }
    } finally {
        process.exit();
    }
}

addBiometricId();
