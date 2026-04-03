const { pool } = require('../Config/dbConfig');

const createLeaveTable = async () => {
    const sql = `
        CREATE TABLE IF NOT EXISTS leaves (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            leave_type VARCHAR(100) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            reason TEXT NOT NULL,
            status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;

    try {
        const connection = await pool.getConnection();
        await connection.query(sql);
        console.log('Leaves table created successfully');
        connection.release();
        process.exit(0);
    } catch (error) {
        console.error('Error creating leaves table:', error.message);
        process.exit(1);
    }
};

createLeaveTable();
