-- Enable foreign key support
PRAGMA foreign_keys = OFF;

-- Drop existing tables if they exist to avoid conflicts
DROP TABLE IF EXISTS qb_company_details;
DROP TABLE IF EXISTS qb_master_companies;

-- Create companies table with user_id as foreign key
CREATE TABLE qb_master_companies (
    company_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    company_name TEXT NOT NULL UNIQUE,
    company_gst_number TEXT UNIQUE,
    company_city TEXT, 
    company_state TEXT,
    company_country TEXT,
    company_pincode TEXT,
    company_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES base_users_master(user_id) ON DELETE CASCADE,
    UNIQUE(user_id, company_name)
);

-- Create company details table
CREATE TABLE qb_company_details (
    company_detail_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    contact_person_name TEXT,
    contact_person_email TEXT,
    contact_person_phone TEXT,
    website TEXT,
    industry TEXT,
    company_description TEXT,
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES qb_master_companies(company_id) ON DELETE CASCADE
);

-- Create a trigger to update the updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_company_details_timestamp
AFTER UPDATE ON qb_company_details
FOR EACH ROW
BEGIN
    UPDATE qb_company_details 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE company_detail_id = OLD.company_detail_id;
END;

-- Create an index on the foreign key for better performance
CREATE INDEX IF NOT EXISTS idx_company_user_id ON qb_master_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_company_details_company_id ON qb_company_details(company_id);

-- Enable foreign key support
PRAGMA foreign_keys = ON;