const { pool } = require('../Config/dbConfig');

async function migrate() {
    try {
        console.log('Starting migration...');

        // Create devices table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS devices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                serial_number VARCHAR(255) NOT NULL UNIQUE,
                location VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('Devices table created or already exists.');

        // Add device_name column to biometric_logs
        try {
            await pool.execute(`
                ALTER TABLE biometric_logs ADD COLUMN device_name VARCHAR(255) AFTER employee_name
            `);
            console.log('Added device_name column to biometric_logs table.');
        } catch (err) {
            if (err.code === 'ER_DUP_COLUMN_NAME') {
                console.log('device_name column already exists in biometric_logs.');
            } else {
                console.error('Error adding device_name column:', err.message);
            }
        }

        // Seed devices from the image
        const devices = [
            { name: 'ACTE MTHLLI', serial: 'NFZ8253803718', location: 'ACTE MTHLLI' },
            { name: 'BDC', serial: 'CGKK210461704', location: 'Velachery' },
            { name: 'ACTE AN', serial: 'A6FE174860464', location: 'Anna Nagar' },
            { name: 'ACTE RAJAJI', serial: 'NFZ8253803715', location: 'ACTE RAJAJI' },
            { name: 'ACTE VLCY', serial: 'CGKK212162446', location: 'VELACHERY 2' },
            { name: 'ACTE BTM', serial: 'NFZ8253803713', location: 'ACTE BTM' },
            { name: 'ACTE E-CITY', serial: 'NFZ8253803716', location: 'E-CITY' },
            { name: 'BDC 2', serial: 'CGKK231063361', location: 'Velachery' }
        ];

        for (const device of devices) {
            try {
                await pool.execute(
                    'INSERT INTO devices (name, serial_number, location) VALUES (?, ?, ?)',
                    [device.name, device.serial, device.location]
                );
                console.log(`Seeded device: ${device.name}`);
            } catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    console.log(`Device ${device.name} already exists, skipping.`);
                } else {
                    console.error(`Error seeding device ${device.name}:`, err.message);
                }
            }
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
