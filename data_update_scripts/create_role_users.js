/**
 * Script to create 5 users each for director, senior manager, manager, and article roles
 */
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Connect to SQLite database
const dbPath = path.join(__dirname, '../db', 'questionbank.db');

// Check if database exists
if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found at ${dbPath}`);
  process.exit(1);
}

console.log('Using database at path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('Connected to database successfully');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON', (err) => {
  if (err) {
    console.error('Error enabling foreign keys:', err);
    process.exit(1);
  }
});

// Define roles to create if they don't exist
const rolesToCreate = [
  {
    name: 'Director',
    description: 'Director role with executive-level permissions',
    permissions: ['user_view', 'user_manage', 'role_view', 'permission_view', 'logs_view']
  },
  {
    name: 'Senior Manager',
    description: 'Senior manager role with leadership permissions',
    permissions: ['user_view', 'role_view', 'permission_view', 'logs_view']
  },
  {
    name: 'Manager',
    description: 'Manager role with team management permissions',
    permissions: ['user_view', 'logs_view']
  },
  {
    name: 'Article',
    description: 'Article role with basic access',
    permissions: ['logs_view']
  }
];

// Define users to create (5 for each role)
const userGroups = {
  Director: [
    { firstName: 'David', lastName: 'Williams', email: 'david.williams@employdex.com', mobile: '9001001001' },
    { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@employdex.com', mobile: '9001001002' },
    { firstName: 'Michael', lastName: 'Davis', email: 'michael.davis@employdex.com', mobile: '9001001003' },
    { firstName: 'Jennifer', lastName: 'Wilson', email: 'jennifer.wilson@employdex.com', mobile: '9001001004' },
    { firstName: 'Robert', lastName: 'Thompson', email: 'robert.thompson@employdex.com', mobile: '9001001005' }
  ],
  'Senior Manager': [
    { firstName: 'Lisa', lastName: 'Anderson', email: 'lisa.anderson@employdex.com', mobile: '9001002001' },
    { firstName: 'James', lastName: 'Martinez', email: 'james.martinez@employdex.com', mobile: '9001002002' },
    { firstName: 'Patricia', lastName: 'Taylor', email: 'patricia.taylor@employdex.com', mobile: '9001002003' },
    { firstName: 'Thomas', lastName: 'Moore', email: 'thomas.moore@employdex.com', mobile: '9001002004' },
    { firstName: 'Jessica', lastName: 'Clark', email: 'jessica.clark@employdex.com', mobile: '9001002005' }
  ],
  Manager: [
    { firstName: 'Daniel', lastName: 'White', email: 'daniel.white@employdex.com', mobile: '9001003001' },
    { firstName: 'Nancy', lastName: 'Lewis', email: 'nancy.lewis@employdex.com', mobile: '9001003002' },
    { firstName: 'Richard', lastName: 'Harris', email: 'richard.harris@employdex.com', mobile: '9001003003' },
    { firstName: 'Laura', lastName: 'Young', email: 'laura.young@employdex.com', mobile: '9001003004' },
    { firstName: 'Kevin', lastName: 'Allen', email: 'kevin.allen@employdex.com', mobile: '9001003005' }
  ],
  Article: [
    { firstName: 'Karen', lastName: 'Walker', email: 'karen.walker@employdex.com', mobile: '9001004001' },
    { firstName: 'Paul', lastName: 'Hall', email: 'paul.hall@employdex.com', mobile: '9001004002' },
    { firstName: 'Betty', lastName: 'Green', email: 'betty.green@employdex.com', mobile: '9001004003' },
    { firstName: 'Mark', lastName: 'Baker', email: 'mark.baker@employdex.com', mobile: '9001004004' },
    { firstName: 'Carol', lastName: 'Nelson', email: 'carol.nelson@employdex.com', mobile: '9001004005' }
  ]
};

// Default password for all users
const DEFAULT_PASSWORD = 'User@123';

// Helper function to hash password
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// Helper function to get a permission ID by name
function getPermissionId(permissionName) {
  return new Promise((resolve, reject) => {
    db.get('SELECT permission_id FROM base_permissions_master WHERE name = ?', [permissionName], (err, result) => {
      if (err) reject(err);
      else resolve(result ? result.permission_id : null);
    });
  });
}

// Check if a role exists
function checkRoleExists(roleName) {
  return new Promise((resolve, reject) => {
    db.get('SELECT role_id FROM base_roles_master WHERE name = ?', [roleName], (err, result) => {
      if (err) reject(err);
      else resolve(result ? result.role_id : null);
    });
  });
}

// Create a role if it doesn't exist
async function ensureRoleExists(roleData) {
  const roleId = await checkRoleExists(roleData.name);
  if (roleId) {
    console.log(`Role "${roleData.name}" already exists with ID: ${roleId}`);
    return roleId;
  }

  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO base_roles_master (name, description) VALUES (?, ?)',
      [roleData.name, roleData.description],
      async function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        const newRoleId = this.lastID;
        console.log(`Created role: ${roleData.name} with ID: ${newRoleId}`);
        
        // Assign permissions to the role
        try {
          for (const permissionName of roleData.permissions) {
            const permissionId = await getPermissionId(permissionName);
            if (!permissionId) {
              console.warn(`Permission "${permissionName}" not found, skipping assignment to role "${roleData.name}"`);
              continue;
            }
            
            await new Promise((resolvePermission, rejectPermission) => {
              db.run(
                'INSERT INTO base_role_permissions_tx (role_id, permission_id) VALUES (?, ?)',
                [newRoleId, permissionId],
                (err) => {
                  if (err) rejectPermission(err);
                  else {
                    console.log(`Assigned permission "${permissionName}" to role "${roleData.name}"`);
                    resolvePermission();
                  }
                }
              );
            });
          }
          resolve(newRoleId);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

// Create a user and assign a role
async function createUser(userData, roleId) {
  try {
    const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
    
    // Check if user already exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT user_id FROM base_users_master WHERE email = ?', [userData.email], (err, user) => {
        if (err) reject(err);
        else resolve(user);
      });
    });
    
    if (existingUser) {
      console.log(`User with email ${userData.email} already exists, skipping`);
      return;
    }
    
    // Insert the user
    const userId = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO base_users_master (mobile_number, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
        [userData.mobile, userData.email, hashedPassword, userData.firstName, userData.lastName],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    
    console.log(`Created user: ${userData.firstName} ${userData.lastName} (${userData.email}) with ID: ${userId}`);
    
    // Assign role to the user
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO base_user_roles_tx (user_id, role_id) VALUES (?, ?)',
        [userId, roleId],
        (err) => {
          if (err) reject(err);
          else {
            console.log(`Assigned role ID ${roleId} to user ${userData.email}`);
            resolve();
          }
        }
      );
    });
    
    return userId;
  } catch (error) {
    console.error(`Error creating user ${userData.email}:`, error);
    throw error;
  }
}

// Main function to orchestrate the process
async function createRolesAndUsers() {
  try {
    console.log('Starting creation of roles and users...');
    
    // First ensure all roles exist
    for (const roleData of rolesToCreate) {
      const roleId = await ensureRoleExists(roleData);
      console.log(`Role "${roleData.name}" has ID: ${roleId}`);
      
      // Create 5 users for this role
      const users = userGroups[roleData.name];
      if (users) {
        console.log(`Creating ${users.length} users for role "${roleData.name}"...`);
        for (const userData of users) {
          await createUser(userData, roleId);
        }
      }
    }
    
    console.log('Completed creating roles and users successfully!');
    db.close(() => {
      console.log('Database connection closed.');
    });
  } catch (error) {
    console.error('Error in main function:', error);
    db.close(() => {
      console.error('Database connection closed due to error.');
      process.exit(1);
    });
  }
}

// Execute the main function
createRolesAndUsers();
