/**
 * Script to add all application routes as feature toggles
 * Usage: node add_route_base_feature_toggles.js
 * 
 * This script will:
 * 1. Add all application routes as feature toggles
 * 2. Configure appropriate permissions
 * 3. Assign admin role full access to all features
 * 4. Assign view permissions to all other roles
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Connect to the database
const db = new sqlite3.Database(path.join(__dirname, '../database.sqlite'));

// All application routes to add as features
const applicationRoutes = [
  // Core routes
  { name: 'dashboard', display_name: 'Dashboard', description: 'Main dashboard', enabled: true },
  
  // User management routes
  { name: 'users_list', display_name: 'User List', description: 'View and manage users', enabled: true },
  { name: 'users_details', display_name: 'User Details', description: 'View user details', enabled: true },
  { name: 'users_create', display_name: 'Create User', description: 'Create new users', enabled: true },
  { name: 'users_edit', display_name: 'Edit User', description: 'Edit existing users', enabled: true },
  { name: 'users_bulk_upload', display_name: 'Bulk User Upload', description: 'Upload users in bulk', enabled: true },
  
  // Role management routes
  { name: 'roles_list', display_name: 'Role List', description: 'View and manage roles', enabled: true },
  { name: 'roles_details', display_name: 'Role Details', description: 'View role details', enabled: true },
  { name: 'roles_create', display_name: 'Create Role', description: 'Create new roles', enabled: true },
  { name: 'roles_edit', display_name: 'Edit Role', description: 'Edit existing roles', enabled: true },
  { name: 'roles_bulk_upload', display_name: 'Bulk Role Upload', description: 'Upload roles in bulk', enabled: true },
  { name: 'roles_base_feature_toggles', display_name: 'Feature Toggle Management', description: 'Manage feature toggles', enabled: true },
  
  // Permission management routes
  { name: 'permissions_list', display_name: 'Permission List', description: 'View and manage permissions', enabled: true },
  { name: 'permissions_details', display_name: 'Permission Details', description: 'View permission details', enabled: true },
  { name: 'permissions_create', display_name: 'Create Permission', description: 'Create new permissions', enabled: true },
  { name: 'permissions_edit', display_name: 'Edit Permission', description: 'Edit existing permissions', enabled: true },
  
  // System routes
  { name: 'activity_logs', display_name: 'Activity Logs', description: 'View system activity logs', enabled: true },
  { name: 'payment_admin', display_name: 'Payment Administration', description: 'Manage payment settings', enabled: true },
  { name: 'file_upload_settings', display_name: 'File Upload Configuration', description: 'Configure file upload settings', enabled: true }
];

// Permission types for each route
const permissionTypes = ['view', 'edit', 'create', 'delete'];

// Function to run a query as a promise
function runQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

// Function to get data as a promise
function getQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Function to add a feature toggle if it doesn't exist
async function ensureFeatureToggle(route) {
  try {
    // Check if feature toggle already exists
    const existing = await getQuery(
      'SELECT * FROM base_feature_toggles WHERE feature_name = ?', 
      [`route_${route.name}`]
    );
    
    if (existing && existing.length > 0) {
      console.log(`Feature toggle for route ${route.name} already exists, skipping...`);
      return existing[0];
    }
    
    // Insert new feature toggle
    await runQuery(
      'INSERT INTO base_feature_toggles (feature_name, description, enabled, created_at, updated_at) VALUES (?, ?, ?, datetime("now"), datetime("now"))',
      [`route_${route.name}`, `Feature toggle for ${route.display_name} route`, route.enabled ? 1 : 0]
    );
    
    console.log(`Added feature toggle for route ${route.name}`);
    
    // Get the newly created feature toggle
    const newToggle = await getQuery(
      'SELECT * FROM base_feature_toggles WHERE feature_name = ?', 
      [`route_${route.name}`]
    );
    
    return newToggle[0];
  } catch (error) {
    console.error(`Error ensuring feature toggle for route ${route.name}:`, error);
    throw error;
  }
}

// Function to ensure permission exists
async function ensurePermission(name, description) {
  try {
    // Check if permission already exists
    const existing = await getQuery(
      'SELECT * FROM permissions WHERE name = ?', 
      [name]
    );
    
    if (existing && existing.length > 0) {
      return existing[0];
    }
    
    // Insert new permission
    await runQuery(
      'INSERT INTO permissions (name, description, created_at, updated_at) VALUES (?, ?, datetime("now"), datetime("now"))',
      [name, description]
    );
    
    console.log(`Added permission: ${name}`);
    
    // Get the newly created permission
    const newPermission = await getQuery(
      'SELECT * FROM permissions WHERE name = ?', 
      [name]
    );
    
    return newPermission[0];
  } catch (error) {
    console.error(`Error ensuring permission ${name}:`, error);
    throw error;
  }
}

// Function to assign permission to role
async function assignPermissionToRole(permissionId, roleId) {
  try {
    // Check if permission is already assigned
    const existing = await getQuery(
      'SELECT * FROM role_permissions WHERE permission_id = ? AND role_id = ?', 
      [permissionId, roleId]
    );
    
    if (existing && existing.length > 0) {
      return;
    }
    
    // Assign permission to role
    await runQuery(
      'INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES (?, ?, datetime("now"))',
      [roleId, permissionId]
    );
    
    console.log(`Assigned permission ${permissionId} to role ${roleId}`);
  } catch (error) {
    console.error(`Error assigning permission ${permissionId} to role ${roleId}:`, error);
    throw error;
  }
}

// Main function to set up all feature toggles and permissions
async function setupFeatureTogglesAndPermissions() {
  try {
    // Get admin role ID
    const adminRole = await getQuery(
      'SELECT * FROM roles WHERE name = ?', 
      ['admin']
    );
    
    if (!adminRole || adminRole.length === 0) {
      throw new Error('Admin role not found');
    }
    
    const adminRoleId = adminRole[0].role_id;
    
    // Get all roles
    const allRoles = await getQuery('SELECT * FROM roles');
    
    // Process each route
    for (const route of applicationRoutes) {
      // Create feature toggle for route
      const featureToggle = await ensureFeatureToggle(route);
      
      // Create permissions for each permission type
      for (const type of permissionTypes) {
        const permissionName = `route_${route.name}_${type}`;
        const permissionDesc = `${type.charAt(0).toUpperCase() + type.slice(1)} access for ${route.display_name}`;
        
        const permission = await ensurePermission(permissionName, permissionDesc);
        
        // Assign all permissions to admin role
        await assignPermissionToRole(permission.permission_id, adminRoleId);
        
        // For non-admin roles, only assign view permissions
        if (type === 'view') {
          for (const role of allRoles) {
            if (role.role_id !== adminRoleId) {
              await assignPermissionToRole(permission.permission_id, role.role_id);
            }
          }
        }
      }
    }
    
    console.log('Successfully set up all route feature toggles and permissions');
  } catch (error) {
    console.error('Error setting up feature toggles and permissions:', error);
  } finally {
    // Close database connection
    db.close();
  }
}

// Run the script
setupFeatureTogglesAndPermissions();
