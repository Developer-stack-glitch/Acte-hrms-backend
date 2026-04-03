const { pool } = require('../Config/dbConfig');

async function fixOrgSchema() {
    try {
        console.log('Starting organization schema fix...');

        // 1. Ensure companies table exists (needed for foreign keys in main mode)
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS companies (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                registration_number VARCHAR(100),
                email VARCHAR(255),
                phone VARCHAR(20),
                address TEXT,
                website VARCHAR(255),
                db_name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Companies table checked/created');

        // 2. Fix branches table
        await pool.execute('ALTER TABLE branches ADD COLUMN IF NOT EXISTS company_id INT AFTER id');
        console.log('Branch table: checked company_id');

        // 3. Fix departments table
        await pool.execute('ALTER TABLE departments ADD COLUMN IF NOT EXISTS company_id INT AFTER id');
        console.log('Department table: checked company_id');

        // 4. Fix designations table
        await pool.execute('ALTER TABLE designations ADD COLUMN IF NOT EXISTS company_id INT AFTER id');
        await pool.execute('ALTER TABLE designations ADD COLUMN IF NOT EXISTS department_id INT AFTER company_id');
        console.log('Designation table: checked company_id and department_id');

        // 5. Add foreign keys safely
        const addFK = async (table, constraint, col, refTable) => {
            try {
                await pool.execute(`ALTER TABLE ${table} ADD CONSTRAINT ${constraint} FOREIGN KEY (${col}) REFERENCES ${refTable}(id) ON DELETE CASCADE`);
                console.log(`Added FK ${constraint} to ${table}`);
            } catch (e) {
                console.log(`FK ${constraint} already exists or error: ${e.message}`);
            }
        };

        await addFK('branches', 'fk_branch_company', 'company_id', 'companies');
        await addFK('departments', 'fk_dept_company', 'company_id', 'companies');
        await addFK('designations', 'fk_desig_company', 'company_id', 'companies');
        await addFK('designations', 'fk_desig_dept', 'department_id', 'departments');

        console.log('Organization schema fix completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Fix failed:', error);
        process.exit(1);
    }
}

fixOrgSchema();
