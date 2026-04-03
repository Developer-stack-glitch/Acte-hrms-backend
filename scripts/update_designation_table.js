const { pool } = require('../Config/dbConfig');

async function updateDesignationTable() {
    try {
        console.log('Starting designation table update...');

        // Add company_id and department_id to designations
        await pool.execute('ALTER TABLE designations ADD COLUMN IF NOT EXISTS company_id INT AFTER id');
        await pool.execute('ALTER TABLE designations ADD COLUMN IF NOT EXISTS department_id INT AFTER company_id');

        // Add foreign keys if they don't exist (using a safe approach)
        try {
            await pool.execute('ALTER TABLE designations ADD CONSTRAINT fk_designation_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE');
            console.log('Added foreign key for company_id');
        } catch (e) {
            console.log('Foreign key for company_id might already exist');
        }

        try {
            await pool.execute('ALTER TABLE designations ADD CONSTRAINT fk_designation_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE');
            console.log('Added foreign key for department_id');
        } catch (e) {
            console.log('Foreign key for department_id might already exist');
        }

        console.log('Designation table updated successfully');
        process.exit(0);
    } catch (error) {
        console.error('Update failed:', error);
        process.exit(1);
    }
}

updateDesignationTable();
