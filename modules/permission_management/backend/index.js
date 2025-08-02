/**
 * Permission Management Module - Backend Implementation
 * Created: 2025-06-27
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../../../middleware/auth');
const { checkPermissions } = require('../../../middleware/rbac');
const { dbMethods } = require('../../database/backend');

// Register module events
const registerModuleEvents = (eventBus) => {
  eventBus.on('permission:updated', (data) => {
    console.log('Permission updated event received:', data);
    // Handle permission update events
  });
};

// Initialize the module
const init = (app) => {
  if (app.locals.eventBus) {
    registerModuleEvents(app.locals.eventBus);
  }
};

/**
 * @route GET /api/permission_management/permissions
 * @description Get all permissions
 * @access Private - Requires permission_view permission
 */
router.get('/permissions', authenticateToken, checkPermissions(['permission_view']), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const eventBus = req.app.locals.eventBus;
    
    // Query all permissions
    const permissions = await dbMethods.all(db, 
      'SELECT permission_id, name, description, created_at, updated_at FROM base_permissions_master ORDER BY name',
      []
    );
    
    // For each permission, count roles that have it
    for (const permission of permissions) {
      const roleCount = await dbMethods.get(db,
        'SELECT COUNT(DISTINCT role_id) as count FROM base_role_permissions_tx WHERE permission_id = ?',
        [permission.permission_id]
      );
      
      permission.role_count = roleCount.count;
    }
    
    // Log activity
    eventBus.emit('log:activity', {
      user_id: req.user.user_id,
      action: 'PERMISSION_LIST_VIEW',
      details: 'Retrieved list of permissions',
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });
    
    return res.status(200).json({
      count: permissions.length,
      permissions
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return res.status(500).json({ error: 'Failed to retrieve permissions' });
  }
});

/**
 * @route GET /api/permission_management/permissions/:id
 * @description Get permission by ID
 * @access Private - Requires permission_view permission
 */
router.get('/permissions/:id', authenticateToken, checkPermissions(['permission_view']), async (req, res) => {
  try {
    const permissionId = req.params.id;
    const db = req.app.locals.db;
    const eventBus = req.app.locals.eventBus;
    
    // Get permission data
    const permission = await dbMethods.get(db, 
      'SELECT permission_id, name, description, created_at, updated_at FROM base_permissions_master WHERE permission_id = ?',
      [permissionId]
    );
    
    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    
    // Get roles that have this permission
    const roles = await dbMethods.all(db, 
      `SELECT r.role_id, r.name, r.description
       FROM base_roles_master r
       JOIN base_role_permissions_tx rp ON r.role_id = rp.role_id
       WHERE rp.permission_id = ?
       ORDER BY r.name`,
      [permissionId]
    );
    
    // Attach roles to the permission
    permission.roles = roles;
    permission.role_count = roles.length;
    
    // Log activity
    eventBus.emit('log:activity', {
      user_id: req.user.user_id,
      action: 'PERMISSION_DETAIL_VIEW',
      details: `Viewed details for permission ID ${permissionId}`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });
    
    return res.status(200).json(permission);
  } catch (error) {
    console.error(`Error fetching permission ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to retrieve permission details' });
  }
});

/**
 * @route POST /api/permission_management/permissions
 * @description Create a new permission
 * @access Private - Requires permission_assign permission
 */
router.post('/permissions', [
  authenticateToken, 
  checkPermissions(['permission_assign']),
  body('name').notEmpty().withMessage('Permission name is required')
    .matches(/^[a-z_]+$/).withMessage('Permission name must be lowercase with underscores only'),
  body('description').notEmpty().withMessage('Description is required')
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, description } = req.body;
    const db = req.app.locals.db;
    const eventBus = req.app.locals.eventBus;
    
    // Check if permission with the same name already exists
    const existingPermission = await dbMethods.get(db, 
      'SELECT permission_id FROM base_permissions_master WHERE name = ?', 
      [name]
    );
    
    if (existingPermission) {
      return res.status(409).json({ error: 'A permission with this name already exists' });
    }
    
    // Create new permission
    const result = await dbMethods.run(db, 
      'INSERT INTO base_permissions_master (name, description) VALUES (?, ?)', 
      [name, description]
    );
    
    const newPermissionId = result.lastID;
    
    // Automatically assign to Admin role
    const adminRole = await dbMethods.get(db, 'SELECT role_id FROM base_roles_master WHERE name = ?', ['Admin']);
    if (adminRole) {
      await dbMethods.run(db, 
        'INSERT INTO base_role_permissions_tx (role_id, permission_id) VALUES (?, ?)',
        [adminRole.role_id, newPermissionId]
      );
    }
    
    // Log activity
    eventBus.emit('log:activity', {
      user_id: req.user.user_id,
      action: 'PERMISSION_CREATED',
      details: `Created new permission: ${name}`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });
    
    // Emit permission created event
    eventBus.emit('permission:created', {
      permission_id: newPermissionId,
      name,
      created_by: req.user.user_id
    });
    
    return res.status(201).json({ 
      message: 'Permission created successfully',
      permission_id: newPermissionId 
    });
  } catch (error) {
    console.error('Error creating permission:', error);
    return res.status(500).json({ error: 'Failed to create permission' });
  }
});

/**
 * @route PUT /api/permission_management/permissions/:id
 * @description Update permission information
 * @access Private - Requires permission_assign permission
 */
router.put('/permissions/:id', [
  authenticateToken, 
  checkPermissions(['permission_assign']),
  body('description').notEmpty().withMessage('Description is required')
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const permissionId = req.params.id;
    const { description } = req.body;
    const db = req.app.locals.db;
    const eventBus = req.app.locals.eventBus;
    
    // Check if permission exists
    const existingPermission = await dbMethods.get(db, 
      'SELECT permission_id, name FROM base_permissions_master WHERE permission_id = ?', 
      [permissionId]
    );
    
    if (!existingPermission) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    
    // Update permission (only description can be updated, name is immutable)
    await dbMethods.run(db, 
      'UPDATE base_permissions_master SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE permission_id = ?', 
      [description, permissionId]
    );
    
    // Log activity
    eventBus.emit('log:activity', {
      user_id: req.user.user_id,
      action: 'PERMISSION_UPDATED',
      details: `Updated permission ID ${permissionId} (${existingPermission.name})`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });
    
    // Emit permission updated event
    eventBus.emit('permission:updated', {
      permission_id: permissionId,
      name: existingPermission.name,
      updated_by: req.user.user_id
    });
    
    return res.status(200).json({ 
      message: 'Permission updated successfully'
    });
  } catch (error) {
    console.error(`Error updating permission ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to update permission' });
  }
});

/**
 * @route GET /api/permission_management/missing-routes
 * @description Get all routes that exist but don't have corresponding permissions
 * @access Private - Requires permission_view permission
 */
router.get('/missing-routes', authenticateToken, checkPermissions(['permission_view']), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const eventBus = req.app.locals.eventBus;
    
    // Get all existing permissions starting with 'route_'
    const existingRoutePermissions = await dbMethods.all(db, 
      'SELECT name FROM base_permissions_master WHERE name LIKE "route_%"',
      []
    );
    
    const existingRoutePermissionNames = new Set(existingRoutePermissions.map(p => p.name));
    
    // Define all expected route permissions based on current codebase analysis
    const expectedRoutePermissions = [
      // Feature toggles
      { name: 'route_get_base_feature_toggles', description: 'Access to list all feature toggles', category: 'base_feature_toggles' },
      { name: 'route_get_base_feature_toggles_name', description: 'Access to get specific feature toggle by name', category: 'base_feature_toggles' },
      { name: 'route_patch_base_feature_toggles_update', description: 'Access to update feature toggle status', category: 'base_feature_toggles' },
      
      // File upload
      { name: 'route_post_file_upload_upload', description: 'Access to upload files', category: 'file_upload' },
      
      // Payment QR codes
      { name: 'route_get_base_payment_qr_codes', description: 'Access to list all QR codes', category: 'payment' },
      { name: 'route_get_base_payment_qr_codes_id', description: 'Access to get specific QR code by ID', category: 'payment' },
      { name: 'route_post_base_payment_qr_codes', description: 'Access to create new QR code', category: 'payment' },
      { name: 'route_post_base_payment_qr_codes_id_activate', description: 'Access to activate QR code', category: 'payment' },
      { name: 'route_delete_base_payment_qr_codes_id', description: 'Access to delete QR code', category: 'payment' },
      { name: 'route_put_base_payment_qr_codes_id', description: 'Access to update QR code', category: 'payment' },
      { name: 'route_patch_base_payment_qr_codes_id_deactivate', description: 'Access to deactivate QR code', category: 'payment' },
      { name: 'route_get_base_payment_qr_codes_id_image', description: 'Access to get QR code image', category: 'payment' },
      
      // Payment transactions
      { name: 'route_post_base_payment_transactions', description: 'Access to create payment transaction', category: 'payment' },
      { name: 'route_get_base_payment_transactions', description: 'Access to list all transactions', category: 'payment' },
      { name: 'route_get_base_payment_transactions_id', description: 'Access to get specific transaction', category: 'payment' },
      { name: 'route_put_base_payment_transactions_id_verify', description: 'Access to verify transaction', category: 'payment' },
      { name: 'route_get_payment_status', description: 'Access to check payment feature status', category: 'payment' },
      
      // Widget config
      { name: 'route_get_widget_config', description: 'Access to get widget configuration', category: 'widget' },
      { name: 'route_post_widget_config', description: 'Access to save widget configuration', category: 'widget' },
      
      // User management
      { name: 'route_get_user_management_users', description: 'Access to list all users', category: 'user_management' },
      { name: 'route_post_user_management_users', description: 'Access to create new user', category: 'user_management' },
      { name: 'route_get_user_management_users_id', description: 'Access to get user by ID', category: 'user_management' },
      { name: 'route_put_user_management_users_id', description: 'Access to update user', category: 'user_management' },
      { name: 'route_patch_user_management_users_id_status', description: 'Access to toggle user status', category: 'user_management' },
      { name: 'route_delete_user_management_users_id', description: 'Access to delete user', category: 'user_management' },
      { name: 'route_get_user_management_users_template', description: 'Access to download user CSV template', category: 'user_management' },
      { name: 'route_post_user_management_users_bulk', description: 'Access to bulk upload users', category: 'user_management' },
      
      // Role management
      { name: 'route_get_role_management_roles', description: 'Access to list all roles', category: 'role_management' },
      { name: 'route_get_role_management_roles_template', description: 'Access to download role template', category: 'role_management' },
      { name: 'route_post_role_management_roles_bulk', description: 'Access to bulk upload roles', category: 'role_management' },
      { name: 'route_get_role_management_roles_id', description: 'Access to get role by ID', category: 'role_management' },
      { name: 'route_post_role_management_roles', description: 'Access to create new role', category: 'role_management' },
      { name: 'route_put_role_management_roles_id', description: 'Access to update role', category: 'role_management' },
      { name: 'route_delete_role_management_roles_id', description: 'Access to delete role', category: 'role_management' },
      
      // Authentication (may not need permissions for public routes)
      { name: 'route_post_authentication_register', description: 'Access to user registration', category: 'authentication' },
      { name: 'route_get_authentication_me', description: 'Access to current user data', category: 'authentication' },
      
      // Logging
      { name: 'route_get_logging_activity', description: 'Access to view activity logs', category: 'logging' },
      { name: 'route_get_logging_actions', description: 'Access to view log action types', category: 'logging' },
      { name: 'route_get_logging_entities', description: 'Access to view log entity types', category: 'logging' },
      { name: 'route_get_logging_stats', description: 'Access to view log statistics', category: 'logging' },
      
      // Permission management
      { name: 'route_get_permission_management_permissions', description: 'Access to list all permissions', category: 'permission_management' },
      { name: 'route_get_permission_management_permissions_id', description: 'Access to get specific permission', category: 'permission_management' },
      { name: 'route_post_permission_management_permissions', description: 'Access to create new permission', category: 'permission_management' },
      { name: 'route_put_permission_management_permissions_id', description: 'Access to update permission', category: 'permission_management' },
      { name: 'route_post_permission_management_assign', description: 'Access to assign permissions to roles', category: 'permission_management' },
      
      // Database
      { name: 'route_get_database_status', description: 'Access to database health status', category: 'database' },
      { name: 'route_post_database_query', description: 'Access to run SQL queries (admin only)', category: 'database' }
    ];
    
    // Find missing permissions
    const missingPermissions = expectedRoutePermissions.filter(
      expected => !existingRoutePermissionNames.has(expected.name)
    );
    
    // Group by category for better organization
    const missingByCategory = missingPermissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {});
    
    // Log activity
    eventBus.emit('log:activity', {
      user_id: req.user.user_id,
      action: 'MISSING_ROUTES_VIEW',
      details: `Retrieved ${missingPermissions.length} missing route permissions`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });
    
    return res.status(200).json({
      total_missing: missingPermissions.length,
      total_expected: expectedRoutePermissions.length,
      missing_permissions: missingPermissions,
      missing_by_category: missingByCategory
    });
  } catch (error) {
    console.error('Error fetching missing route permissions:', error);
    return res.status(500).json({ error: 'Failed to retrieve missing route permissions' });
  }
});

/**
 * @route POST /api/permission_management/create-missing-routes
 * @description Create missing route permissions in bulk
 * @access Private - Requires permission_assign permission
 */
router.post('/create-missing-routes', [
  authenticateToken, 
  checkPermissions(['permission_assign']),
  body('permissions').isArray().withMessage('Permissions must be an array'),
  body('permissions.*.name').notEmpty().withMessage('Permission name is required'),
  body('permissions.*.description').notEmpty().withMessage('Permission description is required')
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { permissions } = req.body;
    const db = req.app.locals.db;
    const eventBus = req.app.locals.eventBus;
    
    const results = {
      created: [],
      skipped: [],
      errors: []
    };
    
    // Get Admin role for auto-assignment
    const adminRole = await dbMethods.get(db, 'SELECT role_id FROM base_roles_master WHERE name = ?', ['Admin']);
    
    for (const permission of permissions) {
      try {
        const { name, description } = permission;
        
        // Check if permission already exists
        const existing = await dbMethods.get(db, 
          'SELECT permission_id FROM base_permissions_master WHERE name = ?', 
          [name]
        );
        
        if (existing) {
          results.skipped.push({ name, reason: 'Already exists' });
          continue;
        }
        
        // Create permission
        const result = await dbMethods.run(db, 
          'INSERT INTO base_permissions_master (name, description) VALUES (?, ?)', 
          [name, description]
        );
        
        const newPermissionId = result.lastID;
        
        // Auto-assign to Admin role
        if (adminRole) {
          await dbMethods.run(db, 
            'INSERT INTO base_role_permissions_tx (role_id, permission_id) VALUES (?, ?)',
            [adminRole.role_id, newPermissionId]
          );
        }
        
        results.created.push({ 
          name, 
          permission_id: newPermissionId,
          assigned_to_admin: !!adminRole 
        });
        
      } catch (permError) {
        console.error(`Error creating permission ${permission.name}:`, permError);
        results.errors.push({ 
          name: permission.name, 
          error: permError.message 
        });
      }
    }
    
    // Log activity
    eventBus.emit('log:activity', {
      user_id: req.user.user_id,
      action: 'MISSING_ROUTES_CREATED',
      details: `Created ${results.created.length} missing route permissions`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });
    
    return res.status(200).json({
      message: `Processed ${permissions.length} permissions`,
      results
    });
  } catch (error) {
    console.error('Error creating missing route permissions:', error);
    return res.status(500).json({ error: 'Failed to create missing route permissions' });
  }
});

/**
 * @route GET /api/permission_management/roles-permissions
 * @description Get all roles with their assigned permissions
 * @access Private - Requires permission_view permission
 */
router.get('/roles-permissions', authenticateToken, checkPermissions(['permission_view']), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const eventBus = req.app.locals.eventBus;
    
    // Get all roles
    const roles = await dbMethods.all(db, 
      'SELECT role_id, name, description, created_at FROM base_roles_master ORDER BY name',
      []
    );
    
    // For each role, get their permissions
    for (const role of roles) {
      const permissions = await dbMethods.all(db, 
        `SELECT p.permission_id, p.name, p.description
         FROM base_permissions_master p
         JOIN base_role_permissions_tx rp ON p.permission_id = rp.permission_id
         WHERE rp.role_id = ?
         ORDER BY p.name`,
        [role.role_id]
      );
      
      role.permissions = permissions;
      role.permission_count = permissions.length;
    }
    
    // Get total permission count for reference
    const totalPermissions = await dbMethods.get(db, 
      'SELECT COUNT(*) as count FROM base_permissions_master',
      []
    );
    
    // Log activity
    eventBus.emit('log:activity', {
      user_id: req.user.user_id,
      action: 'ROLES_PERMISSIONS_VIEW',
      details: 'Retrieved roles with their permissions',
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });
    
    return res.status(200).json({
      roles,
      total_permissions: totalPermissions.count
    });
  } catch (error) {
    console.error('Error fetching roles with permissions:', error);
    return res.status(500).json({ error: 'Failed to retrieve roles with permissions' });
  }
});

/**
 * @route POST /api/permission_management/assign
 * @description Assign or remove permissions from a role
 * @access Private - Requires permission_assign permission
 */
router.post('/assign', [
  authenticateToken, 
  checkPermissions(['permission_assign']),
  body('role_id').isNumeric().withMessage('Valid role ID is required'),
  body('permissions').isArray().withMessage('Permissions must be an array'),
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { role_id, permissions } = req.body;
    const db = req.app.locals.db;
    const eventBus = req.app.locals.eventBus;
    
    // Check if role exists
    const role = await dbMethods.get(db, 'SELECT role_id, name FROM base_roles_master WHERE role_id = ?', [role_id]);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // For Admin role, ensure it keeps all permissions
    if (role_id == 1) {
      const allPermissions = await dbMethods.all(db, 'SELECT permission_id FROM base_permissions_master');
      const allPermissionIds = allPermissions.map(p => p.permission_id);
      
      // Check if all permissions are included
      const hasAllPermissions = allPermissionIds.every(id => 
        permissions.includes(id) || permissions.includes(id.toString())
      );
      
      if (!hasAllPermissions) {
        return res.status(403).json({ error: 'Admin role must have all permissions' });
      }
    }
    
    // Delete existing permissions first
    await dbMethods.run(db, 'DELETE FROM base_role_permissions_tx WHERE role_id = ?', [role_id]);
    
    // Add new permissions
    for (const permissionId of permissions) {
      await dbMethods.run(db, 
        'INSERT INTO base_role_permissions_tx (role_id, permission_id) VALUES (?, ?)', 
        [role_id, permissionId]
      );
    }
    
    // Log activity
    eventBus.emit('log:activity', {
      user_id: req.user.user_id,
      action: 'PERMISSIONS_ASSIGNED',
      details: `Updated permissions for role ${role.name} (${role_id})`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });
    
    // Emit role updated event
    eventBus.emit('role:updated', {
      role_id,
      updated_by: req.user.user_id,
      permissions_changed: true
    });
    
    return res.status(200).json({ 
      message: 'Permissions updated successfully'
    });
  } catch (error) {
    console.error('Error assigning permissions:', error);
    return res.status(500).json({ error: 'Failed to update permissions' });
  }
});

// Export router and init function
module.exports = router;
module.exports.init = init;
