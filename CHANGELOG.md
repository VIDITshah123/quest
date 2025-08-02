## [Unreleased]

### 2025-07-25
- Fixed admin role permissions to ensure complete access to all system features
  - Added missing permissions for bulk upload user functionality
  - Added missing permissions for feature toggle management
  - Created migration script (007_fix_missing_admin_permissions.sql) to ensure admin role has all permissions
  - Verified admin role now has complete access to all system functionality
- Implemented route feature toggles for access control across application
  - Added feature toggle functionality for all application routes
  - Implemented role-based access with admin having full access
  - Other roles granted view permissions for applicable routes
  - Created script to initialize all route feature toggles in database
  - Added context-based feature toggle system for frontend routes

- Added script for bulk updating user mobile numbers and roles from CSV file
  - Created utility script to process CSV data and update existing users
  - Supports updating mobile numbers and assigning new roles in batch
  - Provides detailed logging and success/failure reporting
- Added interactive status toggle in user management table
  - Converted static status badges to interactive toggle buttons
  - Added ability to instantly activate/deactivate users with a single click
  - Protected system admin account from accidental deactivation
  - Implemented optimistic UI updates with error handling
- Enhanced table sorting functionality across all columns in user and role management
  - Added clickable column headers with sort indicators (ascending/descending)
  - Implemented sorting for all data columns including ID, name, email, mobile, role, and status
  - Added consistent visual indicators showing current sort direction
- Added role column and inline role editing functionality in user management table
- Added mobile number field as optional in user bulk upload CSV template
- Added multi-selection and bulk operations functionality for user and role management
  - Implemented checkboxes for user and role selection with "select all" capability
  - Added bulk delete functionality for users and roles with confirmation modals
  - Added bulk role assignment functionality for users
  - Added bulk status toggle (activate/deactivate) for users
  - Implemented system role protection to prevent deletion of critical roles (Admin, System)
  - Added appropriate UI feedback with toast notifications for all bulk operations
- Added rows per page selector (10, 20, 50, 100 options) for all data grids in the application
- Added column-based filtering and sorting capabilities to UserList and RoleList components
- Added 20 new users (5 each for Director, Senior Manager, Manager, and Article roles)
- Fixed role creation and edit functionality by correcting API payload field from 'permission_ids' to 'permissions'
- Enhanced dashboard UI to display components based on user's role and permissions
- Added permission-based filtering for dashboard cards (Users, Roles, Permissions, Activities)
- Added permission-based access control for activity charts and logs section
- Updated dashboard to display a simple "No permissions" card for users without any permissions
- Fixed permission checking logic to avoid infinite loops and redundant API calls
- Removed user_view permission from User role to ensure proper separation of access levels
- Added permission check for file upload widget visibility

### 2025-07-15
- Fixed QR code fetching error (500 Internal Server Error) by adding database table initialization for base_payment_qr_codes and base_payment_transactions tables
- Fixed QR code upload error (500 Internal Server Error) by correcting the path mismatch between multer storage destination and Express static file serving
- Added improved error handling for file uploads in the payment QR code module with better error messages
- Enhanced file validation to ensure only supported image types are accepted
- Added automatic creation of upload directories to prevent errors
- Fixed database column name mismatch by renaming 'enabled' to 'is_enabled' in base_feature_toggles table
- Updated SQL queries in payment module and feature toggles routes to use correct column names ('feature_name' and 'is_enabled')
- Updated migration scripts and data update scripts to use consistent column names

### 2025-07-12
- Fixed 403 Forbidden errors by updating feature toggle routes to allow Admin users access without requiring specific permissions
- Added missing `/api/logging/entities` endpoint to support the ActivityLogs component
- Fixed source map warnings from react-datepicker by adding GENERATE_SOURCEMAP=false to frontend/.env
- Fixed dependency issues by installing missing packages (express, express-validator, jsonwebtoken, @mui/material, @mui/icons-material)
- Fixed middleware import path in payment-transactions.js
- Added checkPermission function to auth middleware
- Resolved module resolution issues for both frontend and backend
- Fixed 500 Server Error in payment module by correcting the feature toggle check middleware to properly handle SQLite integer representation of boolean values

### 2025-07-11
- Added Payment Integration Module with QR code upload/management functionality and feature toggle support
- Added dedicated API endpoints for payment QR code CRUD operations
- Added frontend components for payment settings and QR code management
- Added database schema for payment transactions and QR code storage
- Extended feature toggle system to include payment integration toggle

### 2025-07-10
- Added `proxy` configuration to `frontend/package.json` to forward API requests to Express backend on port 5000. This resolves 404 errors for `/api` requests from React development server.

### Added
- Feature Toggle system: backend API (CRUD, admin/full_access only), DB migration, and frontend admin UI for managing feature flags.
### Fixed
- ActivityLogList: Timestamp now always displays in a readable format using formatTimestamp utility.
- ActivityLogList: Added 'IP Address / Port' column to activity log table. Now displays the source IP/port for each activity log if available.

### Fixed
- Fixed JSX syntax errors in `frontend/src/components/roles/RoleList.js`, specifically the missing or mismatched `<tr>` closing tag and incorrect button/action JSX structure, which caused rendering issues on the Roles List page.

### Improved
- Enhanced the Role Management table UI in `RoleList.js` for better clarity and aesthetics: improved alignment, better action buttons, permission badge wrapping, and custom styles for a modern look.

### Changed
- Role List: Replaced the "View role" action in the Actions column with an "Edit Role" action. The button now navigates to the edit role page and uses the edit icon with text for clarity.

