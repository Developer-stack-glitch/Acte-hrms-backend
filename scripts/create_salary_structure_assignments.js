const { pool } = require('../Config/dbConfig');

const run = async () => {
    try {
        console.log('Creating salary_structure_assignments table...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS salary_structure_assignments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                salary_structure_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_assignment (salary_structure_id, user_id),
                FOREIGN KEY (salary_structure_id) REFERENCES salary_structures(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Successfully created salary_structure_assignments table.');
    } catch (error) {
        console.error('Error creating table:', error.message);
    } finally {
        process.exit();
    }
};

run();
