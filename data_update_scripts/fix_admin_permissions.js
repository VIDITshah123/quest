/**
 * Fix Admin Role Permissions
 * 
 * This script ensures the admin role has all necessary permissions,
 * particularly for bulk upload user and feature toggle functionalities.
 * 
 * Date: 2025-07-25
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database path
const dbPath = path.join(__dirname, '..', 'db', 'questionbank01.db');

// Open database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the database.');
});

async function fixAdminPermissions() {
  try {
    // Get Admin role ID - try both 'Admin' and 'admin' cases
    db.get('SELECT role_id FROM base_roles_master WHERE name = ? OR name = ?', ['Admin', 'admin'], (err, adminRole) => {
      if (err) {
        console.error('Error getting admin role:', err.message);
        return;
      }
      
      if (!adminRole) {
        console.error('Admin role not found');
        return;
      }
      
      const adminRoleId = adminRole.role_id;
      console.log(`Found admin role with ID: ${adminRoleId}`);

      // Get all permissions that should be assigned to admin
      const requiredPermissionPatterns = [
        '%feature_toggle%',         // All feature toggle permissions
        '%route_users_bulk_upload%', // Bulk upload user permissions
        '%route_roles_base_feature_toggles%' // Feature toggle route permissions
      ];
      
      // Assign each set of permissions
      for (const pattern of requiredPermissionPatterns) {
        assignPermissionsMatching(adminRoleId, pattern);
      }
      
      // Also ensure admin has ALL permissions as a final check
      setTimeout(() => {
        assignAllPermissionsToAdmin(adminRoleId);
      }, 1000);
    });
  } catch (error) {
    console.error('Error fixing admin permissions:', error);
  }
}

// Function to assign all permissions matching a pattern to admin role
function assignPermissionsMatching(adminRoleId, pattern) {
  // Get all permissions matching the pattern
  db.all('SELECT permission_id, name FROM base_permissions_master WHERE name LIKE ?', 
    [pattern], 
    (err, permissions) => {
      if (err) {
        console.error(`Error getting permissions matching ${pattern}:`, err.message);
        return;
      }
      
      console.log(`Found ${permissions.length} permissions matching pattern ${pattern}`);
      
      // For each permission, check if it's assigned to admin role and assign if not
      permissions.forEach(permission => {
        checkAndAssignPermission(adminRoleId, permission.permission_id, permission.name);
      });
    }
  );
}

// Function to assign ALL permissions to admin role as a failsafe
function assignAllPermissionsToAdmin(adminRoleId) {
  // Get all permissions
  db.all('SELECT permission_id, name FROM base_permissions_master', [], (err, allPermissions) => {
    if (err) {
      console.error('Error getting all permissions:', err.message);
      return;
    }
    
    console.log(`Checking if admin has all ${allPermissions.length} permissions...`);
    
    // For each permission, check if it's assigned to admin and assign if not
    allPermissions.forEach(permission => {
      checkAndAssignPermission(adminRoleId, permission.permission_id, permission.name);
    });
  });
}

// Function to check if permission is assigned to role and assign if not
function checkAndAssignPermission(roleId, permissionId, permissionName) {
  db.get('SELECT * FROM base_role_permissions_tx WHERE role_id = ? AND permission_id = ?', 
    [roleId, permissionId], 
    (err, rolePermission) => {
      if (err) {
        console.error(`Error checking if ${permissionName} is assigned to role:`, err.message);
        return;
      }
      
      if (!rolePermission) {
        // Permission not assigned, add it
        assignPermissionToRole(roleId, permissionId, permissionName);
      } else {
        console.log(`Permission ${permissionName} already assigned to admin role`);
      }
    }
  );
}

// Function to assign permission to role
function assignPermissionToRole(roleId, permissionId, permissionName) {
  db.run('INSERT INTO base_role_permissions_tx (role_id, permission_id) VALUES (?, ?)', 
    [roleId, permissionId], 
    function(err) {
      if (err) {
        console.error(`Error assigning ${permissionName} to admin role:`, err.message);
        return;
      }
      
      console.log(`Assigned permission ${permissionName} to admin role`);
    }
  );
}

// Run the function
fixAdminPermissions();

// Give enough time for async operations to complete before exiting
setTimeout(() => {
  console.log('Operations completed');
  db.close(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
}, 5000);
