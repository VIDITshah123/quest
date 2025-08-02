import React, { useEffect, useState } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

/**
 * Component that wraps a Route and checks if the feature toggle is enabled
 * If feature is disabled, redirects to unauthorized page
 * 
 * @param {string} feature - The feature name for the route toggle
 * @param {string} permission - The permission required for the route (view, edit, etc.)
 * @param {React.Component} element - The component to render if authorized
 * @param {string} path - The route path
 * @param {Object} rest - Additional props to pass to Route
 */
const FeatureToggleRoute = ({ feature, permission = 'view', element, path, ...rest }) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { hasPermission, authToken, hasRole } = useAuth();

  useEffect(() => {
    const checkFeatureToggle = async () => {
      try {
        // Skip check for admin users - they always have access
        if (hasRole(['admin'])) {
          setIsEnabled(true);
          setIsLoading(false);
          return;
        }

        // Check if feature toggle exists and is enabled
        const response = await axios.get(`/api/feature-toggles/route_${feature}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        // Feature is enabled if toggle exists and is enabled
        setIsEnabled(response.data && response.data.enabled);
        setIsLoading(false);
      } catch (error) {
        // If feature toggle doesn't exist or there's an error, default to enabled for now
        console.warn(`Could not check feature toggle for ${feature}:`, error.message);
        setIsEnabled(true);
        setIsLoading(false);
      }
    };

    if (authToken) {
      checkFeatureToggle();
    }
  }, [feature, authToken, hasRole]);

  // If still loading, don't render anything
  if (isLoading) {
    return null;
  }

  // Check if feature is enabled and user has required permission
  const hasAccess = isEnabled && hasPermission(`route_${feature}_${permission}`);

  // If feature is disabled or user doesn't have permission, redirect to unauthorized
  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Otherwise, render the route
  return <Route path={path} element={element} {...rest} />;
};

export default FeatureToggleRoute;
