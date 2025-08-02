-- EmployDEX Base Platform - Database Initialization Script
-- Created: 2025-06-26

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Create users table (master data)
CREATE TABLE IF NOT EXISTS base_users_master (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    mobile_number TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create roles table (master data)
CREATE TABLE IF NOT EXISTS base_roles_master (
    role_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create permissions table (master data)
CREATE TABLE IF NOT EXISTS base_permissions_master (
    permission_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_roles junction table (transaction data)
CREATE TABLE IF NOT EXISTS base_user_roles_tx (
    user_role_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES base_users_master(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES base_roles_master(role_id) ON DELETE CASCADE
);

-- Create role_permissions junction table (transaction data)
CREATE TABLE IF NOT EXISTS base_role_permissions_tx (
    role_permission_id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES base_roles_master(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES base_permissions_master(permission_id) ON DELETE CASCADE
);

-- Create activity_logs table (transaction data)
CREATE TABLE IF NOT EXISTS base_activity_logs_tx (
    activity_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES base_users_master(user_id) ON DELETE SET NULL
);

-- Payment Integration Module Database Design
-- This file contains the SQL schema for the payment integration module

-- Payment QR Codes Table
-- -- Stores information about uploaded QR codes for payment processing
-- CREATE TABLE IF NOT EXISTS base_payment_qr_codes (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     payment_name VARCHAR(100) NOT NULL,
--     payment_description TEXT,
--     qr_code_image BLOB NOT NULL, -- Binary storage of the QR code image
--     qr_code_path VARCHAR(255),   -- File system path to the QR code image
--     payment_type VARCHAR(50) NOT NULL, -- e.g., 'UPI', 'BANK', 'WALLET'
--     is_active BOOLEAN DEFAULT 0, -- Only one QR code can be active at a time
--     created_by INTEGER NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (created_by) REFERENCES base_users_master(user_id)
-- );

-- Create updated QR codes table
CREATE TABLE IF NOT EXISTS base_payment_qr_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    payment_type VARCHAR(50) NOT NULL, -- e.g., 'UPI', 'BANK', 'WALLET'
    image_url VARCHAR(255),   -- File system path to the QR code image
    active BOOLEAN DEFAULT 0, -- Only one QR code can be active at a time
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on payment type for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_type ON base_payment_qr_codes(payment_type);


CREATE TABLE base_payment_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    qr_code_id INTEGER,
    transaction_ref VARCHAR(100) NOT NULL UNIQUE, -- Unique reference number for the transaction
    user_id INTEGER, -- User who initiated the transaction
    verified BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (qr_code_id) REFERENCES base_payment_qr_codes(id),
    FOREIGN KEY (user_id) REFERENCES base_users_master(user_id)
)

-- -- Payment Transactions Table
-- -- Records all payment transactions processed through the system
-- CREATE TABLE IF NOT EXISTS base_payment_transactions (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     qr_code_id integer not null, 
--     transaction_reference VARCHAR(100) NOT NULL UNIQUE, -- Unique reference number for the transaction
--     amount DECIMAL(10, 2) NOT NULL,
--     currency VARCHAR(3) DEFAULT 'INR',
--     payment_status VARCHAR(20) NOT NULL, -- 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'
--     qr_code_id INTEGER,
--     user_id INTEGER, -- User who initiated the transaction (can be null for anonymous payments)
--     transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     transaction_notes TEXT,
--     transaction_metadata TEXT, -- JSON field for additional data
--     FOREIGN KEY (qr_code_id) REFERENCES base_payment_qr_codes(id),
--     FOREIGN KEY (user_id) REFERENCES base_users_master(user_id)
-- );

-- Create index on transaction reference for faster lookups
CREATE INDEX IF NOT EXISTS idx_transaction_reference ON base_payment_transactions(transaction_reference);

-- Create index on transaction date for reporting
CREATE INDEX IF NOT EXISTS idx_transaction_date ON base_payment_transactions(transaction_date);

-- Create index on payment_status for filtering
CREATE INDEX IF NOT EXISTS idx_transaction_status ON base_payment_transactions(payment_status);


-- Migration: Add base_feature_toggles table
CREATE TABLE IF NOT EXISTS base_feature_toggles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_name TEXT UNIQUE NOT NULL,
    is_enabled INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);




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
INSERT OR IGNORE INTO base_feature_toggles (feature_name, description, is_enabled, feature)
VALUES ('payment_integration', 'Enable payment integration with QR code support', 0, 'payment');
-- Insert all permissions as feature toggles
INSERT INTO base_feature_toggles (feature_name, description, is_enabled, feature)
SELECT name, description, 0, 'permission'
FROM base_permissions_master
ON CONFLICT (feature_name) DO NOTHING;

-- Insert all roles as feature toggles
INSERT INTO base_feature_toggles (feature_name, description, is_enabled, feature)
SELECT name, description, 0, 'role'
FROM base_roles_master
ON CONFLICT (feature_name) DO NOTHING;

-- Sample data for base_payment_qr_codes
INSERT OR IGNORE INTO base_payment_qr_codes (name, description, payment_type, image_url, active) VALUES 
('Default UPI QR', 'Default UPI payment QR code', 'UPI', '/uploads/qr/default_upi.png', 1),
('Corporate Account QR', 'Corporate bank account QR code', 'BANK', '/uploads/qr/corporate.png', 0);

-- Sample data for base_payment_transactions
INSERT OR IGNORE INTO base_payment_transactions (qr_code_id, transaction_ref, user_id, verified) VALUES 
(1, 'TXN123456789', 2, 1),
(1, 'TXN987654321', 3, 0),
(2, 'TXN567890123', 4, 0);


