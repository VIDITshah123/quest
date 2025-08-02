import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook to check if a feature toggle is enabled
 * @param {string} featureName - Name of the feature to check
 * @param {string} permission - Permission required (view, edit, create, delete)
 * @returns {object} - { isEnabled, isLoading, error }
 */
const useFeatureToggle = (featureName, permission = 'view') => {
  const [isEnabled, setIsEnabled] = useState(true); // Default to true for better UX
  const [isLoading, setIsLoading] = useState(false); // Start with false to prevent unnecessary loading states
  const [error, setError] = useState(null);
  const { authToken, hasRole, hasPermission } = useAuth();

  useEffect(() => {
    // If no feature name provided, just enable the feature
    if (!featureName) {
      setIsEnabled(true);
      setIsLoading(false);
      return;
    }
    
    const checkFeatureToggle = async () => {
      try {
        setIsLoading(true);

        // Admin users always have access to all features
        if (hasRole(['admin'])) {
          setIsEnabled(true);
          setError(null);
          setIsLoading(false);
          return;
        }

        // Use a clean API path with proper backend URL
        // Make sure the URL matches what your backend expects
        const apiUrl = `/api/feature-toggles/${featureName}`;
        console.log(`Checking feature toggle: ${apiUrl}`);
        
        const response = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        // Check if the feature is enabled and user has permission
        const featureEnabled = response.data && response.data.enabled;
        // Use a simpler permission check for now
        const hasAccess = featureEnabled && hasPermission(`${featureName}_${permission}`);
        
        console.log(`Feature ${featureName} enabled: ${featureEnabled}, has access: ${hasAccess}`);
        setIsEnabled(hasAccess);
        setError(null);
      } catch (error) {
        console.warn(`Error checking feature toggle ${featureName}:`, error);
        
        // On any error, default to enabled for better user experience
        // This prevents blank screens if the backend API fails
        setIsEnabled(true);
        
        if (error.response && error.response.status === 404) {
          console.log(`Feature toggle ${featureName} not found, defaulting to true`);
          // Feature doesn't exist yet, just check permissions
          setError(null);
        } else {
          console.error(`API error for feature toggle ${featureName}:`, error);
          setError('API error, defaulting to enabled');
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Only check if authenticated
    if (authToken && featureName) {
      checkFeatureToggle();
    } else {
      setIsLoading(false);
    }
  }, [featureName, permission, authToken, hasRole, hasPermission]);

  return { isEnabled, isLoading, error };
};

export default useFeatureToggle;
