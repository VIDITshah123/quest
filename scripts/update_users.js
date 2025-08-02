/**
 * Script to update user mobile numbers and roles from CSV
 * Usage: node update_users.js
 * 
 * This script reads user data from a CSV file and updates mobile numbers and roles
 * for existing users in the EmployDEX system.
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configure axios with detailed error handling
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent hanging
  timeout: 10000
});

// Add response interceptor for better error logging
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

// Authentication function
async function authenticate() {
  try {
    console.log('Attempting to authenticate with admin credentials...');
    const response = await api.post('/authentication/login', {
      username: 'admin', // Using username instead of email
      password: 'Admin@123' // Using default admin credentials from memory
    });
    
    if (response.data && response.data.token) {
      const token = response.data.token;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Successfully authenticated with admin account');
      return token;
    } else {
      console.error('Authentication response did not include token');
      console.log('Response data:', response.data);
      process.exit(1);
    }
  } catch (error) {
    console.error('Authentication failed with error:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

// Function to get all users
async function getUsers() {
  try {
    console.log('Fetching all users from the system...');
    const response = await api.get('/user_management/users');
    
    if (response.data && Array.isArray(response.data.users)) {
      console.log(`Successfully retrieved ${response.data.users.length} users`);
      return response.data.users;
    } else {
      console.error('Unexpected response format when fetching users');
      console.log('Response data:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch users:', error.message);
    if (error.response) {
      console.error('Error status:', error.response.status);
    }
    return [];
  }
}

// Function to get all roles
async function getRoles() {
  try {
    console.log('Fetching all roles from the system...');
    const response = await api.get('/role_management/roles');
    
    if (response.data && Array.isArray(response.data.roles)) {
      console.log(`Successfully retrieved ${response.data.roles.length} roles`);
      return response.data.roles;
    } else {
      console.error('Unexpected response format when fetching roles');
      console.log('Response data:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch roles:', error.message);
    if (error.response) {
      console.error('Error status:', error.response.status);
    }
    return [];
  }
}

// Function to update a user
async function updateUser(userId, userData) {
  try {
    console.log(`Updating user ID ${userId} with new data:`);
    console.log('- Mobile:', userData.mobile_number);
    console.log('- Role IDs:', userData.role_ids);
    
    const response = await api.put(`/user_management/users/${userId}`, userData);
    console.log(`Successfully updated user ID ${userId}`);
    return true;
  } catch (error) {
    console.error(`Failed to update user ID ${userId}:`);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error message:', error.response.data);
    } else {
      console.error(error.message);
    }
    return false;
  }
}

// Main function to process updates
async function processUpdates() {
  try {
    console.log('Starting user update process from CSV data...');
    
    // Authenticate first
    await authenticate();
    
    // Get all users and roles
    const users = await getUsers();
    const roles = await getRoles();
    
    if (!users.length) {
      console.error('No users found - aborting update process');
      process.exit(1);
    }

    if (!roles.length) {
      console.error('No roles found - aborting update process');
      process.exit(1);
    }

    // Create a mapping of role names to role IDs
    const roleMap = {};
    roles.forEach(role => {
      roleMap[role.name.toLowerCase()] = role.role_id;
      // Also store with trimmed spaces for better matching
      roleMap[role.name.toLowerCase().trim()] = role.role_id;
    });

    console.log('Role mapping created:');
    console.log(roleMap);

    // Create a mapping of first names to users for easier lookup
    // Note: This assumes first names are unique in this dataset
    const userMap = {};
    users.forEach(user => {
      const key = user.first_name.toLowerCase().trim();
      userMap[key] = user;
    });

    console.log(`CSV file path: ${path.resolve(__dirname, '../docs/update_details.csv')}`);
    
    // Check if file exists
    if (!fs.existsSync(path.resolve(__dirname, '../docs/update_details.csv'))) {
      console.error('CSV file not found - please check the path');
      process.exit(1);
    }

    // Read and parse the CSV file
    const updates = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(path.resolve(__dirname, '../docs/update_details.csv'))
        .pipe(csv())
        .on('data', (row) => {
          // Clean up the row data and add to updates
          const cleanRow = {};
          Object.keys(row).forEach(key => {
            cleanRow[key] = row[key].trim();
          });
          updates.push(cleanRow);
        })
        .on('error', (error) => {
          console.error('Error reading CSV file:', error);
          reject(error);
        })
        .on('end', async () => {
          console.log(`CSV file successfully processed. Found ${updates.length} updates.`);
          console.log('Sample of CSV data:', updates.slice(0, 2));

          let successCount = 0;
          let failureCount = 0;
          let skippedCount = 0;

          for (const update of updates) {
            const { firstName, roles: roleName, mobilenumber } = update;
            
            if (!firstName || !roleName) {
              console.warn('Skipping row with missing firstName or roles');
              skippedCount++;
              continue;
            }
            
            // Find user by first name (note: this might not be unique - in production you'd want a more unique identifier)
            const userKey = firstName.toLowerCase().trim();
            const user = userMap[userKey];
            
            if (!user) {
              console.warn(`User with first name "${firstName}" not found`);
              failureCount++;
              continue;
            }

            // Find role ID from role name
            const roleKey = roleName.toLowerCase().trim();
            const roleId = roleMap[roleKey];
            if (!roleId) {
              console.warn(`Role "${roleName}" not found in available roles`);
              console.log('Available roles:', Object.keys(roleMap).map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(', '));
              failureCount++;
              continue;
            }

            // Prepare update data - keep existing data for fields not in CSV
            const updateData = {
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              mobile_number: mobilenumber || user.mobile_number || '',
              is_active: user.is_active !== undefined ? user.is_active : true,
              role_ids: [roleId] // Update to single role as specified in CSV
            };

            console.log(`Updating user: ${user.first_name} ${user.last_name}`);
            console.log(`- New mobile: ${updateData.mobile_number}`);
            console.log(`- New role: ${roleName} (ID: ${roleId})`);

            // Update the user
            const success = await updateUser(user.user_id, updateData);
            if (success) {
              successCount++;
            } else {
              failureCount++;
            }
          }

          console.log('\nUpdate Summary:');
          console.log(`- Total records processed: ${updates.length}`);
          console.log(`- Successfully updated: ${successCount}`);
          console.log(`- Failed updates: ${failureCount}`);
          console.log(`- Skipped records: ${skippedCount}`);
          
          resolve();
        });
    });
  } catch (error) {
    console.error('Error in processUpdates:', error);
    process.exit(1);
  }
}

// Run the script
processUpdates()
  .then(() => {
    console.log('Update process initiated');
  })
  .catch(error => {
    console.error('Update process failed:', error);
  });
