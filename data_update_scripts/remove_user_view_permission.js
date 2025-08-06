/**
 * Script to remove 'user_view' permission from the 'User' role
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Connect to SQLite database
const dbPath = path.join(__dirname, '../db', 'questionbank01.db');

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


// Main function to remove permission
async function removeUserViewPermission() {
  return new Promise((resolve, reject) => {
    // Show existing permissions for User role
    const checkPermissionsSql = `
      SELECT p.name, p.permission_id, r.role_id, r.name as role_name
      FROM base_role_permissions_tx rp
      JOIN base_permissions_master p ON rp.permission_id = p.permission_id
      JOIN base_roles_master r ON rp.role_id = r.role_id
      WHERE r.name = 'User'
    `;
    
    db.all(checkPermissionsSql, [], (err, rows) => {
      if (err) {
        console.error('Error checking permissions:', err.message);
        reject(err);
        return;
      }
      
      console.log('Current permissions for User role:', rows);
      
      if (rows.length === 0) {
        console.log('User role has no permissions, nothing to remove');
        resolve();
        return;
      }
      
      // Execute direct SQL to remove the user_view permission from User role
      const sql = `
        DELETE FROM base_role_permissions_tx 
        WHERE role_id = (SELECT role_id FROM base_roles_master WHERE name = 'User')
        AND permission_id = (SELECT permission_id FROM base_permissions_master WHERE name = 'user_view')
      `;
      
      db.run(sql, function(err) {
        if (err) {
          console.error('Error removing permission:', err.message);
          reject(err);
          return;
        }
        
        console.log(`Removed user_view permission from User role. Rows affected: ${this.changes}`);
        
        // Verify permissions were removed
        db.all(checkPermissionsSql, [], (err, rows) => {
          if (err) {
            console.error('Error verifying permissions:', err.message);
            reject(err);
            return;
          }
          
          console.log('Updated permissions for User role after removal:', rows);
          resolve();
        });
      });
    });
  });
}

// Execute the function and close the database connection
removeUserViewPermission()
  .then(() => {
    console.log('Successfully removed user_view permission from User role');
    db.close();
  })
  .catch(err => {
    console.error('Error:', err);
    db.close();
    process.exit(1);
  });
