const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user has required roles
exports.authorizeRoles = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Role ${req.user.role} is not authorized to access this resource` 
      });
    }

    next();
  };
};

// Middleware to check if user has required permissions
exports.checkPermission = (permission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    try {
      // Check if user has the required permission
      const hasPermission = await new Promise((resolve, reject) => {
        db.get(
          `SELECT 1 FROM user_permissions up
           JOIN permissions p ON up.permission_id = p.id
           WHERE up.user_id = ? AND p.name = ?`,
          [req.user.id, permission],
          (err, row) => {
            if (err) return reject(err);
            resolve(!!row);
          }
        );
      });

      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          message: `You don't have permission to ${permission}` 
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ success: false, message: 'Error checking permissions' });
    }
  };
};
