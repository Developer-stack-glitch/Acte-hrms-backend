const { pool } = require('../Config/dbConfig');

async function createAttendanceTable() {
    try {
        console.log('Starting attendance table creation...');

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS attendance (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                date DATE NOT NULL,
                punch_in TIME,
                punch_out TIME,
                late_punch_in VARCHAR(10),
                late_punch_out VARCHAR(10),
                total_hours VARCHAR(10),
                status VARCHAR(50) DEFAULT 'Present',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Attendance table ready');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

createAttendanceTable();
