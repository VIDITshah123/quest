import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useFeatureToggle } from '../../contexts/FeatureToggleContext';

/**
 * Higher-order component that combines feature toggle and permission checking
 * @param {Object} props - Component props
 * @param {React.Component} props.component - The component to render if authorized
 * @param {string} props.featureName - Name of the feature to check
 * @param {string} props.requiredPermission - Permission required to access the route (view, edit, create, delete)
 * @param {Array} props.allowedRoles - Roles that are allowed to access this route
 */
const FeatureRoute = ({ component: Component, featureName, requiredPermission = 'view', allowedRoles = [], ...rest }) => {
  const { hasRole, hasPermission } = useAuth();
  const { isFeatureEnabled, loading } = useFeatureToggle();

  // While feature toggles are loading, return null or a loading indicator
  if (loading) {
    return null;
  }

  // Check if the feature is enabled
  const isEnabled = isFeatureEnabled(`route_${featureName}`);

  // Always allow admin users
  if (hasRole(['admin'])) {
    return <Component {...rest} />;
  }

  // Check if user has required permission or role
  const hasRequiredPermission = hasPermission(`route_${featureName}_${requiredPermission}`);
  const hasRequiredRole = allowedRoles.length > 0 ? hasRole(allowedRoles) : true;

  // If feature is disabled or user doesn't have permission, redirect to unauthorized
  if (!isEnabled || (!hasRequiredPermission && !hasRequiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Otherwise, render the component
  return <Component {...rest} />;
};

export default FeatureRoute;
