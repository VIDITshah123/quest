import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useFeatureToggle } from '../../contexts/FeatureToggleContext';

/**
 * Component that wraps a route and checks if the user has the required role
 * and feature toggle access before rendering the component. 
 * If user doesn't have the required access, they are redirected to the unauthorized page.
 * 
 * The component implements a graceful fallback mechanism to maintain access
 * if feature toggles API is unavailable, based on user roles.
 * 
 * @param {Object} props
 * @param {React.Component} props.component - Component to render if authorized
 * @param {string} props.featureName - Name of the feature toggle to check
 * @param {string} props.permission - Permission type (view, edit, create, delete)
 * @param {Array} props.allowedRoles - Roles that are allowed to access this route
 * @returns {React.Component}
 */
const FeatureProtectedRoute = ({
  component: Component,
  featureName,
  permission = 'view',
  allowedRoles = [],
  ...rest
}) => {
  const location = useLocation();
  const { currentUser, hasRole } = useAuth();
  const { isFeatureEnabled } = useFeatureToggle();
  
  // Only show loading spinner if we're waiting for user authentication
  // Don't block UI on feature toggle API calls
  if (!currentUser) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Admin users always have access to all features
  const isAdmin = hasRole(['admin']);
  
  // Check if user has one of the allowed roles (fallback mechanism)
  const hasAllowedRole = allowedRoles.length === 0 || allowedRoles.some(role => hasRole([role]));
  
  // Check if feature is enabled (defaults to true if not found)
  const featureEnabled = featureName ? isFeatureEnabled(featureName) : true;
  
  // Access is granted if:
  // 1. User is admin (always has access) OR
  // 2. Feature toggle is enabled AND user has allowed role
  // 3. If no roles specified, just check if feature is enabled
  const hasAccess = isAdmin || (featureEnabled && hasAllowedRole);

  // If the user doesn't have access, redirect to the unauthorized page
  if (!hasAccess) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // Otherwise, render the protected component
  return <Component {...rest} />;
};

export default FeatureProtectedRoute;
