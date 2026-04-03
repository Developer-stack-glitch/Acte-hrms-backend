const RolePermission = require('../models/rolePermissionModel');

const initPermissions = async () => {
    try {
        console.log('Initializing role_permissions table...');
        await RolePermission.createTable();
        console.log('Table created successfully.');

        // Seed initial permissions for superadmin
        const superAdminModules = [
            'dashboard', 'employees', 'organization', 'payroll', 'reimbursements',
            'attendance', 'leaves', 'company-policies', 'asset-management', 'jobs-recruitment'
        ];
        
        await RolePermission.upsertPermissions('superadmin', superAdminModules);
        console.log('Superadmin permissions seeded.');

        process.exit(0);
    } catch (error) {
        console.error('Error initializing permissions:', error);
        process.exit(1);
    }
};

initPermissions();
