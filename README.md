# EmployDEX Base Platform

A foundational system providing essential user management capabilities, including user registration, authentication, role-based access control, and an administrative dashboard.

## Project Structure

```
base_v1/
├── backend/             # Express.js API
│   ├── config/          # Configuration files
│   ├── controllers/     # API route controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
│
├── modules/             # Modular functionality
│   └── payment/         # Payment integration module
│       ├── backend/     # Payment backend API
│       └── frontend/    # Payment frontend components
│
├── frontend/            # React frontend
│   ├── public/          # Static files
│   ├── src/             # Source files
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── utils/       # Utility functions
│   │   ├── App.js       # Main app component
│   │   └── index.js     # Entry point
│   └── package.json     # Frontend dependencies
│
├── database/            # SQLite database
│   └── migrations/      # Database migrations
│
├── base_v1.MD           # Project PRD
├── CHANGELOG.md         # Project changelog
├── package.json         # Project dependencies
└── README.md            # Project documentation
```

## Features
- **Route Feature Toggles**:
  - Comprehensive feature toggle system for all application routes
  - Role-based access control with permission checks
  - Admin role automatically granted full access to all routes
  - Other roles granted view-only permissions by default
  - Frontend routes protected by feature toggle status
  - SQL migration script for easy setup of all feature toggles

- **Enhanced User Management Interface**:
  - Interactive status toggle buttons for instant user activation/deactivation
  - Visual status indicators with toggle buttons for authorized users
  - Protection for system accounts from accidental deactivation

- **Enhanced Table Sorting and Management**:
  - Sort any column in user and role tables with intuitive click-to-sort functionality
  - Clear visual indicators showing current sort direction (ascending/descending)
  - Consistent sorting behavior across all data grids

- **Role Management in User Table**: View and manage user roles directly from the user list:
  - Display user roles in a dedicated column for easy identification
  - Change user roles directly from the user table with inline role editing
  - Quick access to role management via dedicated role change button

- **Multi-Selection and Bulk Operations**: Efficiently manage users and roles with powerful bulk operations:
  - Select multiple users or roles with checkbox selection and "select all" capability
  - Perform bulk deletion of users and roles with confirmation dialogs
  - Assign roles to multiple users simultaneously
  - Toggle status (activate/deactivate) for multiple users at once
  - Support for optional mobile number in bulk user uploads
  - System protection prevents deletion of critical system roles (Admin, System)
  - Clear UI feedback with toast notifications for all operations

- **Payment Integration Module**: A comprehensive payment integration system with QR code management and transaction tracking. Admins can upload, activate, and manage payment QR codes through an intuitive UI. The module automatically creates required database tables on initialization.

- **Feature Toggle System**: Comprehensive feature management with role-based access control:
  - **Route-Based Feature Toggles**: All application routes are protected by feature toggles that can be enabled/disabled
  - **Role-Based Access Control**: Admin users have full access to all routes and features
  - **Permission Structure**: Non-admin users have view permissions only for enabled routes
  - **Admin UI**: Admin and Full Access roles can manage feature flags via a dedicated UI
  - **API Integration**: Complete API for managing feature toggles programmatically
  - **Controlled Rollout**: Enable/disable features and routes for controlled deployment

- **Activity Logging**: Activity Log page displays timestamps in a readable format and includes a 'IP Address / Port' column, showing the source of each activity if available.

- **2025-07-10:** Fixed JSX syntax errors in `frontend/src/components/roles/RoleList.js` (missing/mismatched `<tr>` closing tag and action button structure) that caused rendering issues on the Roles List page.
- **2025-07-10:** Improved the Role Management table UI for clarity and modern appearance (better alignment, action buttons, permission badges, and custom styles).


- User registration and authentication with JWT
- Role-based access control (RBAC) system
- User dashboard with activity metrics
- Administrative interface with comprehensive controls
- User, role, and permission management
  - Individual user creation and editing
  - Role management directly from user edit page
  - Bulk user upload via CSV file
  - Bulk role upload via CSV file with permission assignment
  - CSV template download for easy onboarding
- Payment integration with QR code management
  - Upload and manage QR codes for payment collection
  - Activate/deactivate payment methods
  - Track payment transactions
  - Feature toggle for enabling/disabling payment features
- System activity logging and monitoring
- Permission-based UI components
- Role-based dashboard with adaptive cards based on user permissions
  - Dashboard components displayed dynamically based on user's permissions
  - Users without any permissions see a clean "No permissions" message
  - API calls prevented for unauthorized components for improved performance
  - Clear visual indicators for available functionality

## Technology Stack

- **Backend**: Express.js
- **Frontend**: React.js
- **Database**: SQLite
- **Authentication**: JWT

## Getting Started

### Local Development Proxy

The React frontend is configured to proxy API requests to the Express backend:

```
"proxy": "http://localhost:5000"
```

This allows you to use `/api/*` endpoints in your frontend code without specifying the backend port. If you encounter 404 errors for `/api` requests, ensure the proxy is set and restart the React dev server.


### Prerequisites

- Node.js (v14.x or later)
- npm (v6.x or later)

### Installation

1. Clone the repository
2. Install all dependencies using the provided script:
   ```
   npm run install:all
   ```
   This will install both frontend and backend dependencies.

### Running the Application

1. Start both backend and frontend concurrently:
   ```
   npm run start
   ```
   This will start the backend API on port 5000 and the frontend on port 3000.

### Using the Virtual Environment (for Python modules)

The project uses a Python virtual environment for certain backend modules:

1. Activate the virtual environment:
   ```
   source /Users/alokk/EmployDEX/Applications/venv/bin/activate
   ```

2. Install any required Python dependencies within the activated environment.

### Default Access Credentials

#### Administrator User
Use the following credentials to log in as an administrator:

- Username: admin
- Email: admin@employdex.com
- Password: Admin@123

The admin user has full permissions to manage users, roles, and permissions in the system.

#### Full Access User
- Username: fa
- Email: fa@employdex.com
- Password: User@123

The FA user has been assigned the "full_access" role which grants all available permissions in the system. This user can be used for testing and validation purposes.

**Note:** The login has been updated to accept either email, username, or mobile number. You can log in with any of these credentials.

### Access Information

After starting the application:

- Backend API: http://localhost:5000
- Frontend application: http://localhost:3000

### Demo Users

The following demo users are available with the standard "User" role:

1. John Doe (john.doe@employdex.com)
2. Jane Smith (jane.smith@employdex.com)
3. Robert Johnson (robert.johnson@employdex.com)
4. Emily Williams (emily.williams@employdex.com)
5. Michael Brown (michael.brown@employdex.com)

All demo users share the password: User@123

## Database Structure

Refer to the PRD (`base_v1.MD`) for detailed database structure information.

## License

[MIT](https://choosealicense.com/licenses/mit/)
