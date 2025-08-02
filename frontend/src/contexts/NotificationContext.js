import React, { createContext, useState, useContext, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = uuidv4();
    const newNotification = {
      id,
      ...notification,
      timestamp: new Date().toISOString(),
    };

    setNotifications((prev) => [newNotification, ...prev]);
    
    // Auto-remove notification after delay if autoHide is true
    if (notification.autoHide !== false) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Helper function to show notifications with a simpler API
  const showNotification = useCallback((message, type = 'info', options = {}) => {
    return addNotification({
      message,
      type,
      autoHide: true,
      duration: 5000,
      ...options
    });
  }, [addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
        showNotification, // Add the showNotification method to the context value
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
