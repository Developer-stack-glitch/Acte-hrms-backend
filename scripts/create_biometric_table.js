const { pool } = require('../Config/dbConfig');

const createBiometricTable = async () => {
    try {
        console.log('Creating biometric_logs table...');
        await pool.execute('DROP TABLE IF EXISTS biometric_logs');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS biometric_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                biometric_id VARCHAR(50),
                date DATE NOT NULL,
                deduction VARCHAR(50),
                emp_id VARCHAR(50),
                employee_name VARCHAR(255),
                punch_in TIME,
                punch_out TIME,
                shift VARCHAR(100),
                status VARCHAR(50),
                total_hours VARCHAR(20),
                user_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY (biometric_id, date)
            )
        `);

        console.log('Successfully created biometric_logs table.');
    } catch (error) {
        console.error('Error creating biometric_logs table:', error.message);
    } finally {
        process.exit();
    }
};

createBiometricTable();
