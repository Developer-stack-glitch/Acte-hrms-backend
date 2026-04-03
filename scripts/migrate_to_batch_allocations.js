const { pool } = require('../Config/dbConfig');

const run = async () => {
    try {
        console.log('Migrating salary_structures → batch_allocations...');

        // 1. Rename salary_structure_assignments first (it has FK to salary_structures)
        //    Drop the FK constraints, rename table, rename column, re-add FKs
        const [assignTableExists] = await pool.execute(
            `SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'salary_structure_assignments'`
        );

        if (assignTableExists[0].cnt > 0) {
            console.log('  Renaming salary_structure_assignments → batch_allocation_assignments...');

            // Drop foreign keys first
            try {
                const [fks] = await pool.execute(`
                    SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS 
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'salary_structure_assignments' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
                `);
                for (const fk of fks) {
                    await pool.execute(`ALTER TABLE salary_structure_assignments DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
                    console.log(`    Dropped FK: ${fk.CONSTRAINT_NAME}`);
                }
            } catch (e) {
                console.log('    No foreign keys to drop or error:', e.message);
            }

            // Rename column
            try {
                await pool.execute(`ALTER TABLE salary_structure_assignments CHANGE salary_structure_id batch_allocation_id INT NOT NULL`);
                console.log('    Renamed column: salary_structure_id → batch_allocation_id');
            } catch (e) {
                console.log('    Column already renamed or error:', e.message);
            }

            // Drop old unique key and add new one
            try {
                await pool.execute(`ALTER TABLE salary_structure_assignments DROP INDEX unique_assignment`);
                console.log('    Dropped old unique key');
            } catch (e) {
                console.log('    Old unique key already dropped:', e.message);
            }

            // Rename table
            try {
                await pool.execute(`RENAME TABLE salary_structure_assignments TO batch_allocation_assignments`);
                console.log('    Table renamed to batch_allocation_assignments');
            } catch (e) {
                console.log('    Table already renamed or error:', e.message);
            }

            // Add unique key and FKs
            try {
                await pool.execute(`ALTER TABLE batch_allocation_assignments ADD UNIQUE KEY unique_assignment (batch_allocation_id, user_id)`);
                console.log('    Added new unique key');
            } catch (e) {
                console.log('    New unique key already exists:', e.message);
            }
        }

        // 2. Update payroll_runs FK before renaming salary_structures
        const [payrollTableExists] = await pool.execute(
            `SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'payroll_runs'`
        );

        if (payrollTableExists[0].cnt > 0) {
            console.log('  Updating payroll_runs table...');

            // Drop FK constraints
            try {
                const [fks] = await pool.execute(`
                    SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS 
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payroll_runs' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
                `);
                for (const fk of fks) {
                    await pool.execute(`ALTER TABLE payroll_runs DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
                    console.log(`    Dropped FK: ${fk.CONSTRAINT_NAME}`);
                }
            } catch (e) {
                console.log('    No FKs to drop:', e.message);
            }

            // Rename column
            try {
                await pool.execute(`ALTER TABLE payroll_runs CHANGE salary_structure_id batch_allocation_id INT`);
                console.log('    Renamed column: salary_structure_id → batch_allocation_id');
            } catch (e) {
                console.log('    Column already renamed or error:', e.message);
            }
        }

        // 3. Rename salary_structures → batch_allocations
        const [structTableExists] = await pool.execute(
            `SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'salary_structures'`
        );

        if (structTableExists[0].cnt > 0) {
            console.log('  Renaming salary_structures → batch_allocations...');
            await pool.execute(`RENAME TABLE salary_structures TO batch_allocations`);
            console.log('    Table renamed to batch_allocations');
        }

        // 4. Re-add foreign keys with new names
        try {
            await pool.execute(`
                ALTER TABLE batch_allocation_assignments 
                ADD CONSTRAINT fk_baa_batch_allocation FOREIGN KEY (batch_allocation_id) REFERENCES batch_allocations(id) ON DELETE CASCADE
            `);
            console.log('    Added FK: batch_allocation_assignments → batch_allocations');
        } catch (e) {
            console.log('    FK already exists:', e.message);
        }

        try {
            await pool.execute(`
                ALTER TABLE batch_allocation_assignments 
                ADD CONSTRAINT fk_baa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            `);
            console.log('    Added FK: batch_allocation_assignments → users');
        } catch (e) {
            console.log('    FK already exists:', e.message);
        }

        try {
            await pool.execute(`
                ALTER TABLE payroll_runs 
                ADD CONSTRAINT fk_pr_batch_allocation FOREIGN KEY (batch_allocation_id) REFERENCES batch_allocations(id) ON DELETE SET NULL
            `);
            console.log('    Added FK: payroll_runs → batch_allocations');
        } catch (e) {
            console.log('    FK already exists:', e.message);
        }

        console.log('\n✅ Migration completed successfully!');
    } catch (error) {
        console.error('Migration error:', error.message);
    } finally {
        process.exit();
    }
};

run();
