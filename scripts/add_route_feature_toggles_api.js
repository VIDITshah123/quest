/**
 * Script to add all application routes as feature toggles via API calls
 * 
 * Usage:
 * 1. Make sure the backend server is running
 * 2. Execute: node scripts/add_route_base_feature_toggles_api.js
 * 
 * This script will:
 * 1. Authenticate to get an access token
 * 2. Add all application routes as feature toggles via API calls
 * 3. Configure appropriate permissions for each role
 */

const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

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

// Helper function to authenticate and get token
async function authenticate() {
  try {
    console.log(`Authenticating as ${ADMIN_USERNAME}...`);
    const response = await axios.post(`${API_BASE_URL}/authentication/login`, {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD
    });
    
    if (response.data && response.data.token) {
      console.log('Authentication successful!');
      return response.data.token;
    } else {
      throw new Error('Authentication failed: Invalid response');
    }
  } catch (error) {
    console.error('Authentication error:', error.response ? error.response.data : error.message);
    throw new Error('Authentication failed');
  }
}

// Helper function to get all roles
async function getAllRoles(token) {
  try {
    console.log('Fetching all roles...');
    const response = await axios.get(`${API_BASE_URL}/role_management/roles`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data) {
      console.log(`Found ${response.data.length} roles`);
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching roles:', error.response ? error.response.data : error.message);
    throw new Error('Failed to fetch roles');
  }
}

// Helper function to get all permissions
async function getAllPermissions(token) {
  try {
    console.log('Fetching all permissions...');
    const response = await axios.get(`${API_BASE_URL}/permission_management/permissions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data) {
      console.log(`Found ${response.data.length} permissions`);
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching permissions:', error.response ? error.response.data : error.message);
    throw new Error('Failed to fetch permissions');
  }
}

// Helper function to create feature toggle
async function createFeatureToggle(token, route) {
  try {
    const featureName = `route_${route.name}`;
    console.log(`Creating feature toggle: ${featureName}...`);
    
    // First check if feature toggle already exists
    try {
      const checkResponse = await axios.get(`${API_BASE_URL}/feature-toggles/${featureName}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (checkResponse.data) {
        console.log(`Feature toggle ${featureName} already exists, skipping creation...`);
        return checkResponse.data;
      }
    } catch (error) {
      // If 404, continue to create feature toggle
      if (error.response && error.response.status !== 404) {
        throw error;
      }
    }
    
    // Create feature toggle
    const response = await axios.post(
      `${API_BASE_URL}/feature-toggles`,
      {
        feature_name: featureName,
        description: `Feature toggle for ${route.display_name} route`,
        enabled: route.enabled ? 1 : 0
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (response.data) {
      console.log(`Created feature toggle: ${featureName}`);
      return response.data;
    }
    
    throw new Error(`Failed to create feature toggle for ${featureName}`);
  } catch (error) {
    console.error(`Error creating feature toggle:`, error.response ? error.response.data : error.message);
    throw error;
  }
}

// Helper function to create permission
async function createPermission(token, name, description) {
  try {
    console.log(`Creating permission: ${name}...`);
    
    const response = await axios.post(
      `${API_BASE_URL}/permissions`,
      {
        name,
        description
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (response.data) {
      console.log(`Created permission: ${name}`);
      return response.data;
    }
    
    throw new Error(`Failed to create permission ${name}`);
  } catch (error) {
    // If error is 409 (conflict), the permission already exists
    if (error.response && error.response.status === 409) {
      console.log(`Permission ${name} already exists, skipping...`);
      
      // Fetch the existing permission
      const existingPermissions = await getAllPermissions(token);
      const existingPermission = existingPermissions.find(p => p.name === name);
      
      if (existingPermission) {
        return existingPermission;
      }
    }
    
    console.error(`Error creating permission:`, error.response ? error.response.data : error.message);
    throw error;
  }
}

// Helper function to assign permission to role
async function assignPermissionToRole(token, roleId, permissionId) {
  try {
    console.log(`Assigning permission ${permissionId} to role ${roleId}...`);
    
    const response = await axios.post(
      `${API_BASE_URL}/roles/${roleId}/permissions`,
      {
        permission_id: permissionId
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (response.data) {
      console.log(`Assigned permission ${permissionId} to role ${roleId}`);
      return response.data;
    }
    
    throw new Error(`Failed to assign permission ${permissionId} to role ${roleId}`);
  } catch (error) {
    // If error is 409 (conflict), the permission is already assigned
    if (error.response && error.response.status === 409) {
      console.log(`Permission ${permissionId} already assigned to role ${roleId}, skipping...`);
      return { success: true };
    }
    
    console.error(`Error assigning permission:`, error.response ? error.response.data : error.message);
    throw error;
  }
}

// Main function to set up all feature toggles and permissions
async function setupFeatureTogglesAndPermissions() {
  let token;
  
  try {
    // Authenticate
    token = await authenticate();
    
    // Get all roles
    const roles = await getAllRoles(token);
    const adminRole = roles.find(role => role.name.toLowerCase() === 'admin');
    
    if (!adminRole) {
      throw new Error('Admin role not found');
    }
    
    // Process each route
    for (const route of applicationRoutes) {
      // Create feature toggle for route
      await createFeatureToggle(token, route);
      
      // Create permissions for each permission type
      for (const type of permissionTypes) {
        const permissionName = `route_${route.name}_${type}`;
        const permissionDesc = `${type.charAt(0).toUpperCase() + type.slice(1)} access for ${route.display_name}`;
        
        const permission = await createPermission(token, permissionName, permissionDesc);
        
        // Assign all permissions to admin role
        await assignPermissionToRole(token, adminRole.role_id, permission.permission_id);
        
        // For non-admin roles, only assign view permissions
        if (type === 'view') {
          for (const role of roles) {
            if (role.role_id !== adminRole.role_id) {
              await assignPermissionToRole(token, role.role_id, permission.permission_id);
            }
          }
        }
      }
    }
    
    console.log('Successfully set up all route feature toggles and permissions');
  } catch (error) {
    console.error('Error setting up feature toggles and permissions:', error);
  }
}

// Run the script
setupFeatureTogglesAndPermissions();
