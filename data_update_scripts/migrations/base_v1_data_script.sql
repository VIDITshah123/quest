-- Insert default roles
INSERT OR IGNORE INTO base_roles_master (name, description) VALUES 
    ('Admin', 'Administrator with full system access'),
    ('User', 'Standard user with limited access');

-- Insert default permissions
INSERT OR IGNORE INTO base_permissions_master (name, description) VALUES
    ('user_view', 'Can view user details'),
    ('user_create', 'Can create users'),
    ('user_edit', 'Can edit user details'),
    ('user_delete', 'Can delete users'),
    ('role_view', 'Can view roles'),
    ('role_create', 'Can create roles'),
    ('role_edit', 'Can edit roles'),
    ('role_delete', 'Can delete roles'),
    ('permission_view', 'Can view permissions'),
    ('permission_create', 'Can view permissions'),
    ('permission_edit', 'Can view permissions'),
    ('permission_delete', 'Can view permissions'),
   ('feature_toggle_view', 'View feature toggles'),
   ('feature_toggle_manage', 'Create, edit, or delete feature toggles'),
   ('permission_assign', 'Can assign permissions to roles');

-- Assign all permissions to Admin role
INSERT OR IGNORE INTO base_role_permissions_tx (role_id, permission_id)
SELECT 
    (SELECT role_id FROM base_roles_master WHERE name = 'Admin'), 
    permission_id 
FROM base_permissions_master;

-- Assign basic permissions to User role
INSERT OR IGNORE INTO base_role_permissions_tx (role_id, permission_id)
SELECT 
    (SELECT role_id FROM base_roles_master WHERE name = 'User'), 
    permission_id 
FROM base_permissions_master 
WHERE name LIKE '%_view';

-- Insert default admin user with password Admin@123 (admin/admin as per requirements)
INSERT OR IGNORE INTO base_users_master (mobile_number, password_hash, email, first_name, last_name) VALUES ('9999999999', '$2a$10$HCJ5Yd0YR1P4TGPJOyyAWe6jVXnjYQLTP8EuoNRPnT4l4XzUKCNbS', 'admin@employdex.com', 'Admin', 'User'),
('8888888888', '$2a$10$HCJ5Yd0YR1P4TGPJOyyAWe6jVXnjYQLTP8EuoNRPnT4l4XzUKCNbS', 'user@employdex.com', 'User1', 'User1');

-- Note: password_hash is for 'admin' using bcrypt

-- Assign Admin role to the admin user
INSERT OR IGNORE INTO base_user_roles_tx (user_id, role_id)
VALUES (
    (SELECT user_id FROM base_users_master WHERE email = 'admin@employdex.com'),
    (SELECT role_id FROM base_roles_master WHERE name = 'Admin')
),
(
    (SELECT user_id FROM base_users_master WHERE email = 'user@employdex.com'),
    (SELECT role_id FROM base_roles_master WHERE name = 'User')
);


-- Add payment feature to base_feature_toggles table
-- This allows the payment integration to be toggled on/off
