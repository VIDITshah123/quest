import axios from 'axios';
import { toast } from 'react-toastify';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Set the JWT token for authenticated requests
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// Initialize token from localStorage if it exists
const token = localStorage.getItem('token');
if (token) {
  setAuthToken(token);
}

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common error scenarios
    const { response } = error;

    if (response) {
      // Handle specific status codes
      switch (response.status) {
        case 401:
          // Unauthorized - token expired or invalid
          toast.error('Authentication session expired. Please log in again.');
          // Clear token and redirect to login
          setAuthToken(null);
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden - insufficient permissions
          toast.error('You do not have permission to perform this action.');
          break;
        case 404:
          // Not found
          toast.error('The requested resource was not found.');
          break;
        case 422:
          // Validation errors
          if (response.data?.errors) {
            const errors = response.data.errors;
            errors.forEach(err => toast.error(err.msg));
          } else {
            toast.error('Validation error. Please check your input.');
          }
          break;
        case 500:
          // Server error
          toast.error('Server error. Please try again later or contact support.');
          break;
        default:
          // Other errors
          toast.error(response.data?.error || 'An error occurred. Please try again.');
      }
    } else {
      // Network error or server not responding
      toast.error('Unable to connect to server. Please check your internet connection.');
    }

    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (credentials) => api.post('/authentication/login', credentials),
  register: (userData) => api.post('/authentication/register', userData),
  forgotPassword: (email) => api.post('/authentication/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/authentication/reset-password', { token, password }),
};

// User Management API
export const userAPI = {
  getUsers: (params) => api.get('/user_management/users', { params }),
  getUser: (id) => api.get(`/user_management/users/${id}`),
  createUser: (userData) => api.post('/user_management/users', userData),
  updateUser: (id, userData) => api.put(`/user_management/users/${id}`, userData),
  toggleUserStatus: (id, isActive) => api.patch(`/user_management/users/${id}/status`, { is_active: isActive }),
  deleteUser: (id) => api.delete(`/user_management/users/${id}`),
  uploadBulkUsers: (formData) => api.post('/user_management/users/bulk', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  downloadUserTemplate: () => api.get('/user_management/users/template', {
    responseType: 'blob'
  }),
  // Bulk operations
  bulkDeleteUsers: (userIds) => api.delete('/user_management/users/bulk-delete', { data: { userIds } }),
  bulkAssignRole: (userIds, roleId) => api.post('/user_management/users/bulk-role', { userIds, roleId }),
  bulkToggleStatus: (userIds, isActive) => {
    return api.put('/users/bulk/toggle-status', { userIds, isActive });
  },
  // Company Management
  getCompanies: (params = {}) => {
    // Ensure we're only getting company users
    return api.get('/users', { 
      params: { 
        ...params, 
        role: 'company',
        includeDetails: true 
      } 
    });
  },
  getCompany: (id) => {
    return api.get(`/users/${id}`, { 
      params: { includeDetails: true } 
    });
  },
  createCompany: (companyData) => {
    // Ensure the role is set to company
    return api.post('/users', { ...companyData, role: 'company' });
  },
  updateCompany: (id, companyData) => {
    return api.put(`/users/${id}`, companyData);
  },
  getCompanyEmployees: (companyId, params = {}) => {
    return api.get(`/users/company/${companyId}/employees`, { params });
  },
  getCompanyStats: (companyId) => {
    return api.get(`/users/company/${companyId}/stats`);
  }
};

// Role Management API
export const roleAPI = {
  getRoles: (params) => api.get('/role_management/roles', { params }),
  getRole: (id) => api.get(`/role_management/roles/${id}`),
  createRole: (roleData) => api.post('/role_management/roles', roleData),
  updateRole: (id, roleData) => api.put(`/role_management/roles/${id}`, roleData),
  deleteRole: (id) => api.delete(`/role_management/roles/${id}`),
  getPermissions: () => api.get('/role_management/permissions'),
  uploadBulkRoles: (formData, onUploadProgress) => {
    return api.post('/role_management/roles/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    });
  },
  // Bulk operations
  bulkDeleteRoles: (roleIds) => api.delete('/role_management/roles/bulk-delete', { data: { roleIds } }),
  downloadRoleTemplate: () => {
    return api.get('/role_management/roles/template', {
      responseType: 'blob'
    }).then(response => {
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'role-template.csv');
      
      // Append to html page
      document.body.appendChild(link);
      
      // Force download
      link.click();
      
      // Clean up and remove the link
      link.parentNode.removeChild(link);
    });
  }
};

// Permission Management API
export const permissionAPI = {
  getPermissions: () => api.get('/permission_management/permissions'),
  getPermission: (id) => api.get(`/permission_management/permissions/${id}`),
  createPermission: (permissionData) => api.post('/permission_management/permissions', permissionData),
  updatePermission: (id, permissionData) => api.put(`/permission_management/permissions/${id}`, permissionData),
  assignPermissions: (roleId, permissions) => api.post('/permission_management/assign', { role_id: roleId, permissions }),
  getMissingRoutes: () => api.get('/permission_management/missing-routes'),
  createMissingRoutes: (permissions) => api.post('/permission_management/create-missing-routes', { permissions }),
  getRolesWithPermissions: () => api.get('/permission_management/roles-permissions'),
};

// Logging API
export const loggingAPI = {
  getLogs: (params) => api.get('/logging/activity', { params }),
  getActionTypes: () => api.get('/logging/actions'),
  getEntityTypes: () => api.get('/logging/entities'),
  getStats: () => api.get('/logging/stats'),
};

// Feature Toggles API
export const featureToggleAPI = {
  getToggles: () => api.get('/feature-toggles'),
  getToggle: (name) => api.get(`/feature-toggles/${name}`),
  updateToggle: (name, isEnabled) => api.patch('/feature-toggles/update', { name, is_enabled: isEnabled }),
};

// Question Bank API
export const questionAPI = {
  // Questions
  getQuestions: (params) => api.get('/questions', { params }),
  getQuestion: (id) => api.get(`/questions/${id}`),
  createQuestion: (questionData) => api.post('/questions', questionData),
  updateQuestion: (id, questionData) => api.put(`/questions/${id}`, questionData),
  deleteQuestion: (id) => api.delete(`/questions/${id}`),
  bulkDeleteQuestions: (questionIds) => api.delete('/questions/bulk-delete', { data: { questionIds } }),
  
  // Categories
  getCategories: () => api.get('/questions/categories'),
  createCategory: (categoryData) => api.post('/questions/categories', categoryData),
  updateCategory: (id, categoryData) => api.put(`/questions/categories/${id}`, categoryData),
  deleteCategory: (id) => api.delete(`/questions/categories/${id}`),
  
  // Favorites
  getFavorites: (params) => api.get('/questions/favorites', { params }),
  addFavorite: (questionId) => api.post(`/questions/${questionId}/favorite`),
  removeFavorite: (questionId) => api.delete(`/questions/${questionId}/favorite`),
  
  // Import/Export
  importQuestions: (formData, onUploadProgress) => api.post('/questions/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress
  }),
  exportQuestions: (params) => api.get('/questions/export', { 
    params,
    responseType: 'blob' 
  }),
  downloadTemplate: () => api.get('/questions/template', { responseType: 'blob' })
};

// Leaderboard API
export const leaderboardAPI = {
  getLeaderboard: (params) => api.get('/leaderboard', { params }),
  getUserRank: (userId) => api.get(`/leaderboard/user/${userId}`),
  getStats: () => api.get('/leaderboard/stats'),
  getTimeRanges: () => api.get('/leaderboard/time-ranges')
};

// Favorites API
export const favoritesAPI = {
  getFavorites: (params) => api.get('/favorites', { params }),
  addFavorite: (questionId) => api.post('/favorites', { questionId }),
  removeFavorite: (favoriteId) => api.delete(`/favorites/${favoriteId}`),
  bulkRemoveFavorites: (favoriteIds) => api.delete('/favorites/bulk-remove', { data: { favoriteIds } })
};

// Payment API
export const paymentAPI = {
  // QR Code operations
  getQrCodes: () => api.get('/payment/qr-codes'),
  getQrCode: (id) => api.get(`/payment/qr-codes/${id}`),
  deleteQrCode: (id) => api.delete(`/payment/qr-codes/${id}`),
  activateQrCode: (id) => api.post(`/payment/qr-codes/${id}/activate`),
  // Transactions
  getTransactions: (params) => api.get('/payment/transactions', { params }),
  getTransaction: (id) => api.get(`/payment/transactions/${id}`),
  // Special handling for file uploads with authentication
  uploadQrCode: (formData) => {
    const token = localStorage.getItem('token');
    return api.post('/payment/qr-codes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });
  },
  // Feature toggle status
  getPaymentStatus: () => api.get('/payment/status')
};

export default api;
