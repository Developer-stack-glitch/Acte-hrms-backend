const { pool } = require('./Config/dbConfig');

const createNotificationsTable = async () => {
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                role ENUM('superadmin', 'admin', 'employee') NULL,
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                data JSON NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (user_id),
                INDEX (role),
                INDEX (is_read),
                INDEX (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('Notifications table created or already exists.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating notifications table:', error);
        process.exit(1);
    }
};

createNotificationsTable();
