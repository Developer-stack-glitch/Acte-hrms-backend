const { pool } = require('../Config/dbConfig');

const run = async () => {
    try {
        console.log('Creating payroll_items table...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS payroll_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                payroll_run_id INT,
                user_id INT,
                employee_name VARCHAR(255),
                emp_id VARCHAR(50),
                department VARCHAR(100),
                designation VARCHAR(100),
                base_salary DECIMAL(15, 2),
                paid_days DECIMAL(5, 2),
                absent_days DECIMAL(5, 2),
                gross_salary DECIMAL(15, 2),
                lop_amount DECIMAL(15, 2),
                epf_deduction DECIMAL(15, 2),
                esi_deduction DECIMAL(15, 2),
                pt_deduction DECIMAL(15, 2),
                other_deductions DECIMAL(15, 2) DEFAULT 0.00,
                bonus_incentives DECIMAL(15, 2) DEFAULT 0.00,
                net_salary DECIMAL(15, 2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('Successfully created payroll_items table.');

        // Also check if status enum in payroll_runs needs updating
        console.log('Checking payroll_runs status column...');
        // Just in case, try to update the status column to include more states
        try {
            await pool.execute("ALTER TABLE payroll_runs MODIFY COLUMN status ENUM('Pending', 'Active', 'Processing', 'Completed', 'Cancelled') DEFAULT 'Active'");
            console.log('Updated payroll_runs status enum.');
        } catch (e) {
            console.log('Note: status enum update might have failed or not needed:', e.message);
        }

    } catch (error) {
        console.error('Error in migration:', error.message);
    } finally {
        process.exit();
    }
};

run();
