# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

EmployDEX Base Platform is a full-stack user management system with role-based access control.

### Core Structure
- **Backend**: Express.js API (port 5000) with SQLite database
- **Frontend**: React.js SPA (port 3000) with proxy to backend
- **Database**: SQLite with migrations system
- **Authentication**: JWT-based with role-based permissions

### Key Directories
- `backend/` - Express.js API server
  - `routes/` - API endpoints
  - `middleware/` - Auth and RBAC middleware
  - `migrations/` - Database schema changes
- `frontend/src/` - React application
  - `components/` - Reusable UI components organized by domain
  - `contexts/` - React contexts (Auth, FeatureToggle)
  - `services/` - API integration layer
- `modules/` - Modular backend functionality (authentication, payment, etc.)
- `data_update_scripts/` - Database utilities and migration helpers

## Development Commands

### Setup and Installation
```bash
npm run install:all          # Install all dependencies (root, backend, frontend)
```

### Running the Application
```bash
npm run start                # Start both backend and frontend concurrently
npm run start:backend        # Backend only (from backend/ directory)
npm run start:frontend       # Frontend only (from frontend/ directory)
```

### Backend Development
```bash
cd backend
npm run dev                  # Start with nodemon for auto-reload
npm run migrate             # Run database migrations
npm run seed                # Seed sample data
npm test                    # Run Jest tests
```

### Frontend Development
```bash
cd frontend
npm start                   # Start development server
npm run build               # Production build
npm test                    # Run React tests
```

## Database Management

The project uses SQLite with a migration system. Database files:
- Development: `db/questionbank01.db`
- Legacy: `database.sqlite`

### Running Migrations
```bash
cd backend && npm run migrate
```

### Migration Files
Located in `backend/migrations/` with numbered prefixes (e.g., `006_add_route_feature_toggle_permissions.sql`)

## Key Features and Architecture Patterns

### Feature Toggle System
- All routes protected by feature toggles in database
- Admin users have full access by default
- Frontend components use `FeatureToggleContext` and `useFeatureToggle` hook
- Route protection via `FeatureProtectedRoute` and `RouteWithFeatureToggle` components

### Role-Based Access Control (RBAC)
- Three-tier system: Users → Roles → Permissions
- Middleware: `middleware/auth.js` and `middleware/rbac.js`
- Default roles: Admin, User, Full Access
- Admin role has complete system access

### Authentication Flow
- JWT tokens stored in localStorage
- AuthContext provides user state management
- ProtectedRoute component for auth-required pages
- Login accepts email, username, or mobile number

### Component Organization
Components are organized by domain:
- `authentication/` - Login, Register, Password Reset
- `users/` - User management with bulk operations
- `roles/` - Role management with permissions
- `payment/` - QR code and transaction management
- `common/` - Shared components (Navbar, Sidebar, Modals)

### API Integration
- Centralized in `frontend/src/services/api.js`
- Axios with JWT token injection
- Error handling with toast notifications
- Proxy configuration: `"proxy": "http://localhost:5000"`

## Default Credentials

**Admin User:**
- Username: admin
- Email: admin@employdex.com  
- Password: Admin@123

**Full Access User:**
- Username: fa
- Email: fa@employdex.com
- Password: User@123

## Testing Strategy

- Backend: Jest with Supertest for API testing
- Frontend: React Testing Library
- Test files located alongside source files or in `__tests__` directories

## Important Development Notes

### Frontend Proxy Setup
The React app proxies API requests to the backend. If `/api/*` requests return 404, ensure:
1. Backend is running on port 5000
2. Proxy is configured in `frontend/package.json`
3. React dev server is restarted after proxy changes

### Database Considerations
- SQLite database files should not be committed with sensitive data
- Use migration scripts for schema changes
- Seed scripts available for sample data

### Module System
The `modules/` directory contains feature-specific backend logic. Each module has its own `backend/index.js` entry point for modular organization.

### Bulk Operations
Users and roles support CSV bulk upload with validation. Templates available through the UI download functionality.