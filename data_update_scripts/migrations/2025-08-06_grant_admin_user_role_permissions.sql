-- Grant Admin users permission to manage user roles
-- Migration: 2025-08-06

-- Begin transaction
BEGIN TRANSACTION;

-- 1. Ensure the user management permissions exist
INSERT OR IGNORE INTO base_permissions_master (name, description) VALUES
    ('user_manage', 'Can manage users (create, edit, delete)'),
    ('user_role_manage', 'Can assign/change user roles');

-- 2. Grant user management permissions to Admin role
INSERT OR IGNORE INTO base_role_permissions_tx (role_id, permission_id)
SELECT 
    (SELECT role_id FROM base_roles_master WHERE name = 'Admin'),
    permission_id 
FROM base_permissions_master
WHERE name IN (
    'user_manage',
    'user_role_manage'
);

-- 3. Also ensure Admin has all user-related permissions that might exist
INSERT OR IGNORE INTO base_role_permissions_tx (role_id, permission_id)
SELECT 
    (SELECT role_id FROM base_roles_master WHERE name = 'Admin'),
    permission_id 
FROM base_permissions_master
WHERE name LIKE 'user_%'
AND permission_id NOT IN (
    SELECT rp.permission_id 
    FROM base_role_permissions_tx rp
    JOIN base_roles_master r ON rp.role_id = r.role_id
    WHERE r.name = 'Admin'
);

-- Commit the transaction
COMMIT;

-- Verify the changes
SELECT 
    r.name as role_name,
    p.name as permission_name,
    p.description as permission_description
FROM base_roles_master r
JOIN base_role_permissions_tx rp ON r.role_id = rp.role_id
JOIN base_permissions_master p ON rp.permission_id = p.permission_id
WHERE r.name = 'Admin'
ORDER BY p.name;
