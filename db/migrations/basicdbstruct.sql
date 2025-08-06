-- drop all tables if they already exist
PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS qb_master_companies;
DROP TABLE IF EXISTS qb_master_employees;
DROP TABLE IF EXISTS qb_master_questions;
DROP TABLE IF EXISTS qb_master_categories;
DROP TABLE IF EXISTS qb_master_subcategories;
DROP TABLE IF EXISTS qb_company_details;
DROP TABLE IF EXISTS qb_employee_details;
DROP TABLE IF EXISTS qb_question_answer_options;
DROP TABLE IF EXISTS qb_question_votes;
DROP TABLE IF EXISTS qb_question_scores;
DROP TABLE IF EXISTS qb_audit_question_edits;
DROP TABLE IF EXISTS qb_audit_employee_activities;
DROP TABLE IF EXISTS qb_company_feature_toogle;

-- Companies
CREATE TABLE qb_master_companies (
    company_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL UNIQUE,
    company_gst_number TEXT UNIQUE,
    company_city text, 
    company_state text,
    company_country text,
    company_pincode text,
    company_address text,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);

-- employees
CREATE TABLE qb_master_employees (
    employee_id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_name TEXT NOT NULL UNIQUE,
    employee_email TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);


-- Question Categories
CREATE TABLE qb_master_categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name TEXT NOT NULL UNIQUE,
    category_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Question Subcategories
CREATE TABLE qb_master_subcategories (
    subcategory_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    subcategory_name TEXT NOT NULL,
    subcategory_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, subcategory_name),
    FOREIGN KEY (category_id) REFERENCES qb_master_categories(category_id)
);

-- Questions
CREATE TABLE qb_master_questions (
    question_id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_writer_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    category_id INTEGER,
    subcategory_id INTEGER,
    question_type TEXT DEFAULT 'mcq' CHECK(question_type IN ('mcq', 'true_false')),
    question_instructions TEXT,
    difficulty_level TEXT CHECK(difficulty_level IN ('easy', 'medium', 'hard')),
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_writer_id) REFERENCES qb_master_employees(employee_id),
    FOREIGN KEY (category_id) REFERENCES qb_master_categories(category_id),
    FOREIGN KEY (subcategory_id) REFERENCES qb_master_subcategories(subcategory_id)
);

-- Company Details
CREATE TABLE qb_company_details (
    company_detail_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    company_address TEXT,
    company_website TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES qb_master_companies(company_id)
);

-- employee Details and Roles
CREATE TABLE qb_employee_details (
    employee_detail_id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    role_type TEXT CHECK(role_type IN ('question_writer', 'reviewer')),
    first_name TEXT,
    last_name TEXT,
    phone_number TEXT,
    last_login TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES qb_master_employees(employee_id),
    FOREIGN KEY (company_id) REFERENCES qb_master_companies(company_id)
);


-- Question Options
CREATE TABLE qb_question_answer_options (
    option_id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT 0,
    option_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES qb_master_questions(question_id) ON DELETE CASCADE
);

-- Votes
CREATE TABLE qb_question_votes (
    vote_id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    voter_id INTEGER NOT NULL,
    vote_type TEXT CHECK(vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(question_id, voter_id),
    FOREIGN KEY (question_id) REFERENCES qb_master_questions(question_id),
    FOREIGN KEY (voter_id) REFERENCES qb_master_employees(employee_id)
);

-- Question Scores (Denormalized for performance)
CREATE TABLE qb_question_scores (
    question_id INTEGER PRIMARY KEY,
    base_score INTEGER DEFAULT 100,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    total_score INTEGER GENERATED ALWAYS AS (base_score + upvotes - downvotes) STORED,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES qb_master_questions(question_id)
);



-- Question Edits History
CREATE TABLE qb_audit_question_edits (
    edit_id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    editor_id INTEGER NOT NULL,
    edit_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_question_text TEXT,
    new_question_text TEXT,
    FOREIGN KEY (question_id) REFERENCES qb_master_questions(question_id),
    FOREIGN KEY (editor_id) REFERENCES qb_master_employees(employee_id)
);

-- employee Activity Logs
CREATE TABLE qb_audit_employee_activities (
    activity_id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    activity_type TEXT NOT NULL,
    activity_details TEXT,
    ip_address TEXT,
    employee_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES qb_master_employees(employee_id)
);

-- Company Feature Toggle Table
CREATE TABLE qb_company_feature_toogle (
    company_feature_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    feature_id INTEGER NOT NULL,
    is_enabled INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES qb_master_companies(company_id),
    FOREIGN KEY (feature_id) REFERENCES base_feature_toggles(feature_toggle_id)
);
