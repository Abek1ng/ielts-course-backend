// scripts/testModuleManagement.js
require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
let authToken;
let testModuleId;

const testModuleManagement = async () => {
  try {
    // Login as admin
    console.log('Logging in as admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    });

    authToken = loginResponse.data.token;
    console.log('Login successful');

    // Create test module
    console.log('\nTesting module creation...');
    const moduleData = {
      id: `test-module-${Date.now()}`,
      title: 'Test Module Management',
      description: 'A test module for management functionality',
      order: 1
    };

    const createResponse = await axios.post(
      `${API_URL}/content/modules`,
      moduleData,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    testModuleId = createResponse.data.data._id;
    console.log('Module created successfully:', testModuleId);

    // Get module
    console.log('\nTesting module retrieval...');
    const getResponse = await axios.get(
      `${API_URL}/content/modules/${testModuleId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('Module retrieved successfully:', getResponse.data.data.title);

    // Update module
    console.log('\nTesting module update...');
    const updateResponse = await axios.put(
      `${API_URL}/content/modules/${testModuleId}`,
      {
        ...moduleData,
        title: 'Updated Test Module',
        description: 'Updated description'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('Module updated successfully:', updateResponse.data.data.title);

    // Get all modules
    console.log('\nTesting modules list retrieval...');
    const listResponse = await axios.get(
      `${API_URL}/content/modules`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('Modules list retrieved:', listResponse.data.data.length, 'modules');

    // Delete module
    console.log('\nTesting module deletion...');
    await axios.delete(
      `${API_URL}/content/modules/${testModuleId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('Module deleted successfully');

    // Verify deletion
    try {
      await axios.get(
        `${API_URL}/content/modules/${testModuleId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      throw new Error('Module still exists!');
    } catch (err) {
      if (err.response?.status === 404) {
        console.log('Deletion verified - module not found');
      } else {
        throw err;
      }
    }

    console.log('\nAll module management tests completed successfully!');
    console.log('\nTest URLs:');
    console.log('Admin Dashboard:', 'http://localhost:3001/admin');
    console.log('Create Module:', 'http://localhost:3001/admin/modules/new');

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Error details:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  }
};

testModuleManagement();