const { pool } = require('../Config/dbConfig');

async function migrate() {
    try {
        console.log('Starting recruitment migration...');

        // Create jobs table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS jobs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                requirements TEXT,
                department VARCHAR(255),
                location VARCHAR(255),
                job_type ENUM('Full-time', 'Part-time', 'Contract', 'Internship', 'Remote') DEFAULT 'Full-time',
                salary_range VARCHAR(255),
                status ENUM('Open', 'Closed', 'Draft') DEFAULT 'Open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('Jobs table created or already exists.');

        // Create applicants table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS applicants (
                id INT AUTO_INCREMENT PRIMARY KEY,
                job_id INT,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                resume_url VARCHAR(255),
                status ENUM('Applied', 'Interviewing', 'Offered', 'Hired', 'Rejected') DEFAULT 'Applied',
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
            )
        `);
        console.log('Applicants table created or already exists.');

        // Seed some sample data if tables are empty
        const [existingJobs] = await pool.execute('SELECT COUNT(*) as count FROM jobs');
        if (existingJobs[0].count === 0) {
            const sampleJobs = [
                ['Senior Frontend Developer', 'We are looking for a Senior React Developer...', '5+ years experience, React, Node.js', 'Engineering', 'Remote', 'Full-time', '80k - 120k', 'Open'],
                ['HR Manager', 'Manage employee relations and recruitment...', 'HR degree, 3+ years experience', 'Human Resources', 'New York', 'Full-time', '60k - 90k', 'Open'],
                ['Marketing Intern', 'Assist with social media and campaigns...', 'Currently studying marketing', 'Marketing', 'London', 'Internship', '20k - 25k', 'Open']
            ];

            for (const job of sampleJobs) {
                await pool.execute(
                    'INSERT INTO jobs (title, description, requirements, department, location, job_type, salary_range, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    job
                );
            }
            console.log('Seeded sample jobs.');
        }

        console.log('Recruitment migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Recruitment migration failed:', error);
        process.exit(1);
    }
}

migrate();
