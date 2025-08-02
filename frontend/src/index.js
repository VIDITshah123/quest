import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FeatureToggleProvider } from './contexts/FeatureToggleContext';
import { NotificationProvider } from './contexts/NotificationContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './styles/glassmorphism.css';
import { ToastContainer } from 'react-toastify';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <FeatureToggleProvider>
          <NotificationProvider>
            <App />
            <ToastContainer position="top-right" autoClose={3000} />
          </NotificationProvider>
        </FeatureToggleProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
