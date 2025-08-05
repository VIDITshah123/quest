-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Create a trigger to handle company creation across multiple tables
CREATE TRIGGER IF NOT EXISTS after_company_user_insert
AFTER INSERT ON base_users_master
WHEN NEW.role = 'company' OR EXISTS (
    SELECT 1 FROM base_user_roles_tx ur 
    JOIN base_roles_master rm ON ur.role_id = rm.role_id 
    WHERE ur.user_id = NEW.user_id AND rm.name = 'company'
)
BEGIN
    -- Insert into qb_master_companies
    INSERT INTO qb_master_companies (
        company_name,
        company_gst_number,
        company_city,
        company_state,
        company_country,
        company_pincode,
        company_address,
        created_at,
        is_active
    ) VALUES (
        CASE 
            WHEN NEW.company_name IS NOT NULL THEN NEW.company_name
            ELSE (NEW.first_name || ' ' || NEW.last_name)
        END,
        NEW.gst_number,
        NEW.city,
        NEW.state,
        NEW.country,
        NEW.pincode,
        NEW.address,
        CURRENT_TIMESTAMP,
        1
    );
    
    -- The second trigger will handle the company details insertion
END;

-- Create a second trigger to handle the company details insertion
CREATE TRIGGER IF NOT EXISTS after_company_inserted
AFTER INSERT ON qb_master_companies
BEGIN
    -- Insert into qb_company_details
    INSERT INTO qb_company_details (
        company_id,
        contact_person_name,
        contact_person_email,
        contact_person_phone,
        website,
        industry,
        company_description,
        logo_url,
        created_at,
        updated_at
    ) 
    SELECT 
        NEW.company_id,
        (u.first_name || ' ' || u.last_name),
        u.email,
        u.mobile_number,
        u.website,
        u.industry,
        u.company_description,
        NULL,  -- logo_url can be updated later
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM base_users_master u
    WHERE (u.company_name = NEW.company_name OR (u.company_name IS NULL AND (u.first_name || ' ' || u.last_name) = NEW.company_name))
    LIMIT 1;
    
    -- Log the company creation
    INSERT INTO base_activity_logs_tx (
        user_id,
        action_type,
        entity_type,
        entity_id,
        description,
        ip_address,
        user_agent,
        created_at
    ) 
    SELECT 
        u.user_id,
        'CREATE',
        'COMPANY',
        NEW.company_id,
        'New company created: ' || NEW.company_name,
        'SYSTEM',
        'SYSTEM',
        CURRENT_TIMESTAMP
    FROM base_users_master u
    WHERE (u.company_name = NEW.company_name OR (u.company_name IS NULL AND (u.first_name || ' ' || u.last_name) = NEW.company_name))
    LIMIT 1;
END;

-- Note: Since SQLite doesn't support stored procedures directly,
-- you'll need to implement the company creation logic in your application code.
-- Here's the recommended approach:
-- 1. Start a transaction
-- 2. Insert the user into base_users_master
-- 3. Insert the user-role mapping into base_user_roles_tx
-- 4. The triggers will handle the rest (qb_master_companies, qb_company_details, and activity log)
-- 5. Commit the transaction