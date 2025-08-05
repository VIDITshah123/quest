import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Nav } from 'react-bootstrap';

// Layout Components
import MainLayout from './components/common/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import FeatureProtectedRoute from './components/common/FeatureProtectedRoute';

// Authentication Components
import Login from './components/authentication/Login';
import Register from './components/authentication/Register';
import ForgotPassword from './components/authentication/ForgotPassword';
import ResetPassword from './components/authentication/ResetPassword';
import Unauthorized from './components/common/Unauthorized';

// Dashboard Components
import Dashboard from './components/dashboard/Dashboard';

// Question Management Components
import QuestionList from './components/questions/QuestionList';
import QuestionCreate from './components/questions/QuestionCreate';
import QuestionEdit from './components/questions/QuestionEdit';
import QuestionCategories from './components/questions/QuestionCategories';

// Leaderboard Components
import Leaderboard from './components/leaderboard/Leaderboard';

// Favorites Components
import Favorites from './components/favorites/Favorites';

// User Management Components
import UserList from './components/users/UserList';
import UserDetails from './components/users/UserDetails';
import UserCreate from './components/users/UserCreate';
import UserEdit from './components/users/UserEdit';
import UserBulkUpload from './components/users/UserBulkUpload';

// Company Management Components
import CompanyList from './components/companies/CompanyList';
import CompanyForm from './components/companies/CompanyForm';
import CompanyDetails from './components/companies/CompanyDetails';

// Role Management Components
import RoleList from './components/roles/RoleList';
import FeatureToggleList from './components/feature/FeatureToggleList';
import RoleDetails from './components/roles/RoleDetails';
import RoleCreate from './components/roles/RoleCreate';
import RoleEdit from './components/roles/RoleEdit';
import RoleBulkUpload from './components/roles/RoleBulkUpload';

// Permission Management Components
import PermissionList from './components/permissions/PermissionList';
import PermissionDetails from './components/permissions/PermissionDetails';
import PermissionCreate from './components/permissions/PermissionCreate';
import PermissionEdit from './components/permissions/PermissionEdit';

// Logging Components
import ActivityLogs from './components/logging/ActivityLogs';

// Payment Components
import PaymentAdmin from './pages/admin/PaymentAdmin';
import FileUploadConfig from './components/fileupload/FileUploadConfig';


// Common Components


function App() {
  const { isAuthenticated, isLoading, currentUser, hasRole } = useAuth();
  
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  // Simplified withFeatureRoute function to avoid navigation issues
  // For now, we're using just the ProtectedRoute with role checks
  // We'll reimplement feature toggles gradually after fixing navigation
  const withFeatureRoute = (Component, featureName, permission = 'view', allowedRoles = []) => {
    // For now, use standard role-based protection for all routes
    // This ensures pages load correctly while we debug feature toggle API issues
    return <ProtectedRoute element={<Component />} allowedRoles={allowedRoles} />;
  };
  
  return (
    <React.Fragment>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="payment-admin" element={
            <ProtectedRoute element={<PaymentAdmin />} allowedRoles={['admin']} />
          } />
          
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={withFeatureRoute(Dashboard, 'dashboard', 'view')} />
          
          {/* User Management Routes */}
          <Route path="users">
            <Route index element={withFeatureRoute(UserList, 'users_list', 'view')} />
            <Route path=":id" element={<ProtectedRoute element={<UserDetails />} />} />
            <Route path="create" element={<ProtectedRoute element={<UserCreate />} allowedRoles={['admin']} />} />
            <Route path="edit/:id" element={<ProtectedRoute element={<UserEdit />} allowedRoles={['admin']} />} />
            <Route path="bulk-upload" element={<ProtectedRoute element={<UserBulkUpload />} allowedRoles={['admin']} />} />
          </Route>
          
          {/* Role Management Routes */}
          <Route path="roles">
            <Route index element={withFeatureRoute(RoleList, 'roles_list', 'view')} />
            <Route path=":id" element={<ProtectedRoute element={<RoleDetails />} />} />
            <Route path="create" element={<ProtectedRoute element={<RoleCreate />} allowedRoles={['admin']} />} />
            <Route path="feature-toggles" element={<ProtectedRoute element={<FeatureToggleList />} allowedRoles={['admin', 'full_access']} />} />
            <Route path="edit/:id" element={<ProtectedRoute element={<RoleEdit />} allowedRoles={['admin']} />} />
            <Route path="bulk-upload" element={<ProtectedRoute element={<RoleBulkUpload />} allowedRoles={['admin']} />} />
          </Route>
          
          {/* Permission Management Routes */}
          <Route path="permissions">
            <Route index element={<ProtectedRoute element={<PermissionList />} />} />
            <Route path=":id" element={<ProtectedRoute element={<PermissionDetails />} />} />
            <Route path="create" element={<ProtectedRoute element={<PermissionCreate />} allowedRoles={['admin']} />} />
            <Route path="edit/:id" element={<ProtectedRoute element={<PermissionEdit />} allowedRoles={['admin']} />} />
          </Route>
          
          {/* Logging Routes */}
          <Route path="logs" element={<ProtectedRoute element={<ActivityLogs />} />} />
          
          {/* Question Management Routes */}
          <Route path="questions">
            <Route index element={withFeatureRoute(QuestionList, 'questions_list', 'view')} />
            <Route path="create" element={<ProtectedRoute element={<QuestionCreate />} allowedRoles={['admin', 'content_creator']} />} />
            <Route path="edit/:id" element={<ProtectedRoute element={<QuestionEdit />} allowedRoles={['admin', 'content_creator']} />} />
            <Route path="categories" element={<ProtectedRoute element={<QuestionCategories />} allowedRoles={['admin', 'content_creator']} />} />
          </Route>

          {/* Leaderboard Route */}
          <Route path="leaderboard" element={<ProtectedRoute element={<Leaderboard />} />} />
          
          {/* Favorites Route */}
          <Route path="favorites" element={<ProtectedRoute element={<Favorites />} />} />
          
          {/* Payment Routes */}
          <Route path="payment" element={<ProtectedRoute element={<PaymentAdmin />} allowedRoles={['admin']} />} />

          {/* File Upload Widget Routes */}
          <Route path="admin/file-upload-settings" element={<ProtectedRoute element={<FileUploadConfig />} allowedRoles={['admin']} />} />
          
          {/* Company Management Routes */}
          <Route path="companies">
            <Route index element={<ProtectedRoute element={<CompanyList />} allowedRoles={['admin']} />} />
            <Route path="new" element={<ProtectedRoute element={<CompanyForm />} allowedRoles={['admin']} />} />
            <Route path=":id" element={<ProtectedRoute element={<CompanyDetails />} allowedRoles={['admin']} />} />
            <Route path=":id/edit" element={<ProtectedRoute element={<CompanyForm />} allowedRoles={['admin']} />} />
          </Route>
        </Route>
        
        {/* Catch All Route */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </React.Fragment>
  );
}

export default App;
