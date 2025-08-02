import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

/**
 * Higher-order component that wraps a component with feature toggle functionality
 * If the feature is disabled or user lacks permission, redirects to unauthorized
 * 
 * @param {React.Component} Component - Component to render if authorized
 * @param {string} feature - Feature name for the toggle
 * @param {string} permission - Permission required (view, edit, create, delete)
 * @returns {React.Component} - Wrapped component with feature toggle check
 */
const RouteWithFeatureToggle = ({ Component, feature, permission = 'view' }) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { authToken, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const checkFeatureToggle = async () => {
      try {
        // Admin always has access to all features
        if (hasRole(['admin'])) {
          setIsEnabled(true);
          setIsLoading(false);
          return;
        }

        // Check if feature toggle exists and is enabled
        const response = await axios.get(`/api/feature-toggles/route_${feature}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        setIsEnabled(response.data && response.data.enabled);
        setIsLoading(false);
      } catch (error) {
        console.warn(`Feature toggle check for ${feature} failed:`, error.message);
        // Default to enabled if there's an error
        setIsEnabled(true);
        setIsLoading(false);
      }
    };

    if (authToken) {
      checkFeatureToggle();
    }
  }, [feature, authToken, hasRole]);

  // Show loading or nothing while checking feature status
  if (isLoading) {
    return <div className="text-center p-5">Loading...</div>;
  }

  // Check if feature is enabled and user has permission
  const hasAccess = isEnabled && (
    hasRole(['admin']) || 
    hasPermission(`route_${feature}_${permission}`)
  );

  // If feature is disabled or no permission, redirect to unauthorized
  if (!hasAccess) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // Otherwise, render the wrapped component
  return <Component />;
};

export default RouteWithFeatureToggle;
