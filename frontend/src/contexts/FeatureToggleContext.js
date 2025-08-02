import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

// Create a context for feature toggles
const FeatureToggleContext = createContext();

// Custom hook to use the feature toggle context
export const useFeatureToggle = () => useContext(FeatureToggleContext);

// Provider component for feature toggles
export const FeatureToggleProvider = ({ children }) => {
  const [featureToggles, setFeatureToggles] = useState({});
  const [loading, setLoading] = useState(true);
  const { authToken, isAuthenticated } = useAuth();

  // Fetch all feature toggles from the API
  useEffect(() => {
    const fetchFeatureToggles = async () => {
      if (!isAuthenticated || !authToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('/api/feature-toggles', {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        // Convert array to a map for easier access
        const togglesMap = {};
        if (response.data && Array.isArray(response.data)) {
          response.data.forEach(toggle => {
            togglesMap[toggle.feature_name] = toggle.enabled === 1;
          });
        }

        setFeatureToggles(togglesMap);
        setLoading(false);
      } catch (error) {
        console.warn('Feature toggles API not available, defaulting to enabled:', error.message);
        // Don't prevent app from working if feature toggles API fails
        setFeatureToggles({});
        setLoading(false);
      }
    };

    fetchFeatureToggles();
  }, [authToken, isAuthenticated]);

  // Check if a feature is enabled
  const isFeatureEnabled = (featureName) => {
    // Admin users always have access to all features
    if (featureToggles[featureName] !== undefined) {
      return featureToggles[featureName];
    }
    // Default to true for features not defined in the database
    return true;
  };

  // The context value that will be provided
  const contextValue = {
    featureToggles,
    loading,
    isFeatureEnabled
  };

  return (
    <FeatureToggleContext.Provider value={contextValue}>
      {children}
    </FeatureToggleContext.Provider>
  );
};

export default FeatureToggleContext;
