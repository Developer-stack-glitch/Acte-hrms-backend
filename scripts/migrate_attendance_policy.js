const Organization = require('../models/organizationModel');
const { getTenantPool } = require('../Config/dbConfig');

const run = async () => {
    try {
        console.log('Starting migration for attendance policy tables...');
        const companies = await Organization.getAllCompanies();

        for (const company of companies) {
            if (company.db_name) {
                console.log(`Updating database for company: ${company.name} (${company.db_name})`);
                const tenantPool = getTenantPool(company.db_name);

                try {
                    // Attendance Policy Rules Table
                    await tenantPool.execute(`
                        CREATE TABLE IF NOT EXISTS attendance_policy_rules (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            rule_name VARCHAR(255) NOT NULL,
                            priority INT DEFAULT 1,
                            description TEXT,
                            trigger_condition VARCHAR(100),
                            no_of_times INT,
                            within_period VARCHAR(50),
                            how_many_period INT,
                            action_type VARCHAR(100),
                            apply_to VARCHAR(100),
                            is_active TINYINT(1) DEFAULT 1,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                        )
                    `);

                    // Attendance Policy Rule Assignments Table
                    await tenantPool.execute(`
                        CREATE TABLE IF NOT EXISTS attendance_policy_rule_assignments (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            rule_id INT NOT NULL,
                            user_id INT NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (rule_id) REFERENCES attendance_policy_rules(id) ON DELETE CASCADE,
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                        )
                    `);
                    console.log(`Successfully updated tables for ${company.db_name}`);
                } catch (dbError) {
                    console.error(`Error updating database ${company.db_name}:`, dbError.message);
                } finally {
                    await tenantPool.end();
                }
            }
        }
        console.log('Successfully completed migration for all tenant databases.');
    } catch (error) {
        console.error('Migration failed:', error.message);
    } finally {
        process.exit();
    }
};

run();
