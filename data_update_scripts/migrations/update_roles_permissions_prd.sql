-- Update Roles and Permissions for Question Bank Management System
-- Migration: 2025-08-01

-- Begin transaction
BEGIN TRANSACTION;

-- 1. Update existing roles
UPDATE base_roles_master 
SET description = 'Administrator with full system access. Can view and manage all companies.'
WHERE name = 'Admin';

-- 2. Add new roles for PRD
INSERT OR IGNORE INTO base_roles_master (name, description) VALUES 
    ('Company', 'Company administrator. Can manage employees and view all questions.'),
    ('question_writer', 'Can create, edit, and delete own questions. Can vote on questions.'),
    ('Reviewer', 'Can review and vote on questions. Can mark questions as invalid.');

-- 3. Create permissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS base_permissions_master (
    permission_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create role_permissions junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS base_role_permissions_tx (
    role_permission_id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES base_roles_master(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES base_permissions_master(permission_id) ON DELETE CASCADE
);

-- 5. Create user_roles junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS base_user_roles_tx (
    user_role_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES base_users_master(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES base_roles_master(role_id) ON DELETE CASCADE
);

-- 6. Add new permissions for PRD features
INSERT OR IGNORE INTO base_permissions_master (name, description) VALUES
    -- Company permissions
    ('company_view', 'Can view company information'),
    ('company_manage', 'Can manage company settings and employees'),
    
    -- Question permissions
    ('question_view', 'Can view questions'),
    ('question_create', 'Can create new questions'),
    ('question_edit_own', 'Can edit own questions'),
    ('question_delete_own', 'Can delete own questions'),
    ('question_vote', 'Can vote on questions'),
    ('question_mark_invalid', 'Can mark questions as invalid'),
    
    -- Employee management permissions
    ('employee_view', 'Can view employee information'),
    ('employee_manage', 'Can add/remove employees'),
    ('employee_role_manage', 'Can assign/change employee roles'),
    
    -- Leaderboard permissions
    ('leaderboard_view', 'Can view leaderboards'),
    
    -- Category permissions
    ('category_manage', 'Can manage question categories');

-- 7. Map permissions to roles
-- Admin gets all permissions
INSERT OR IGNORE INTO base_role_permissions_tx (role_id, permission_id)
SELECT 
    (SELECT role_id FROM base_roles_master WHERE name = 'Admin'),
    permission_id 
FROM base_permissions_master
WHERE name NOT IN (
    SELECT p.name 
    FROM base_permissions_master p
    JOIN base_role_permissions_tx rp ON p.permission_id = rp.permission_id
    JOIN base_roles_master r ON rp.role_id = r.role_id
    WHERE r.name = 'Admin'
);

-- Company role permissions
INSERT OR IGNORE INTO base_role_permissions_tx (role_id, permission_id)
SELECT 
    (SELECT role_id FROM base_roles_master WHERE name = 'Company'),
    permission_id 
FROM base_permissions_master
WHERE name IN (
    'company_view',
    'employee_view',
    'employee_manage',
    'employee_role_manage',
    'question_view',
    'leaderboard_view',
    'category_manage'
);

-- question_writer role permissions
INSERT OR IGNORE INTO base_role_permissions_tx (role_id, permission_id)
SELECT 
    (SELECT role_id FROM base_roles_master WHERE name = 'question_writer'),
    permission_id 
FROM base_permissions_master
WHERE name IN (
    'question_view',
    'question_create',
    'question_edit_own',
    'question_delete_own',
    'question_vote',
    'leaderboard_view'
);

-- Reviewer role permissions
INSERT OR IGNORE INTO base_role_permissions_tx (role_id, permission_id)
SELECT 
    (SELECT role_id FROM base_roles_master WHERE name = 'Reviewer'),
    permission_id 
FROM base_permissions_master
WHERE name IN (
    'question_view',
    'question_vote',
    'question_mark_invalid',
    'leaderboard_view'
);

-- 8. Update default User role to have minimal permissions
DELETE FROM base_role_permissions_tx 
WHERE role_id = (SELECT role_id FROM base_roles_master WHERE name = 'User');

INSERT OR IGNORE INTO base_role_permissions_tx (role_id, permission_id)
SELECT 
    (SELECT role_id FROM base_roles_master WHERE name = 'User'),
    permission_id 
FROM base_permissions_master
WHERE name = 'question_view';

-- 9. Update the default admin user to ensure it has the Admin role
INSERT OR IGNORE INTO base_user_roles_tx (user_id, role_id)
SELECT 
    (SELECT user_id FROM base_users_master WHERE email = 'admin@employdex.com' LIMIT 1),
    (SELECT role_id FROM base_roles_master WHERE name = 'Admin')
WHERE NOT EXISTS (
    SELECT 1 FROM base_user_roles_tx ur
    JOIN base_users_master u ON ur.user_id = u.user_id
    JOIN base_roles_master r ON ur.role_id = r.role_id
    WHERE u.email = 'admin@employdex.com' AND r.name = 'Admin'
);

-- Commit the transaction
COMMIT;

-- 10. Verify the changes
SELECT r.name AS role, p.name AS permission
FROM base_roles_master r
JOIN base_role_permissions_tx rp ON r.role_id = rp.role_id
JOIN base_permissions_master p ON rp.permission_id = p.permission_id
ORDER BY r.name, p.name;
