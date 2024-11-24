// scripts/testLessonApi.js
require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
let authToken;
let testModuleId;
let testLessonId;

// Generate a unique ID using timestamp
const generateUniqueId = (prefix) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const testLessonApi = async () => {
  try {
    // Login as admin
    console.log('Testing admin login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    });

    authToken = loginResponse.data.token;
    console.log('Admin login successful');

    // Create test module
    console.log('\nTesting module creation...');
    const uniqueModuleId = generateUniqueId('test-module');
    const moduleResponse = await axios.post(
      `${API_URL}/content/modules`,
      {
        id: uniqueModuleId,
        title: 'Test Module API',
        description: 'Test module description'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (!moduleResponse.data.success) {
      throw new Error('Module creation failed: ' + moduleResponse.data.message);
    }

    testModuleId = moduleResponse.data.data._id;
    console.log('Module created successfully:', testModuleId);

    // Create test lesson
    console.log('\nTesting lesson creation...');
    const lessonResponse = await axios.post(
      `${API_URL}/content/modules/${testModuleId}/lessons`,
      {
        title: 'Test Lesson API',
        contentSections: [{
          title: 'Test Section',
          paragraphs: ['Test paragraph']
        }],
        vocabularyExercises: [{
          exerciseType: 'matching',
          instructions: 'Test instructions',
          questions: [{
            term: 'Test term',
            options: ['Option 1', 'Option 2'],
            correctAnswer: 0
          }]
        }],
        practiceExercises: [{
          exerciseType: 'writing',
          instructions: 'Test writing instructions',
          questions: ['Test question']
        }]
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (!lessonResponse.data.success) {
      throw new Error('Lesson creation failed: ' + lessonResponse.data.message);
    }

    testLessonId = lessonResponse.data.data._id;
    console.log('Lesson created successfully:', testLessonId);

    // Test getting lessons for module
    console.log('\nTesting lessons retrieval...');
    const getLessonsResponse = await axios.get(
      `${API_URL}/content/modules/${testModuleId}/lessons`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (!getLessonsResponse.data.success) {
      throw new Error('Lessons retrieval failed: ' + getLessonsResponse.data.message);
    }

    console.log('Lessons retrieved successfully:', getLessonsResponse.data.data);

    // Test updating lesson
    console.log('\nTesting lesson update...');
    const updateResponse = await axios.put(
      `${API_URL}/content/modules/${testModuleId}/lessons/${testLessonId}`,
      {
        title: 'Updated Test Lesson API',
        contentSections: [{
          title: 'Updated Test Section',
          paragraphs: ['Updated test paragraph']
        }]
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (!updateResponse.data.success) {
      throw new Error('Lesson update failed: ' + updateResponse.data.message);
    }

    console.log('Lesson updated successfully');

    // Clean up test data
    console.log('\nCleaning up test data...');
    try {
      // Delete lesson first
      const deleteLessonResponse = await axios.delete(
        `${API_URL}/content/modules/${testModuleId}/lessons/${testLessonId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      console.log('Lesson deleted successfully');

      // Then delete module
      const deleteModuleResponse = await axios.delete(
        `${API_URL}/content/modules/${testModuleId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      console.log('Module deleted successfully');
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError.response?.data || cleanupError.message);
    }

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Error details:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    // Attempt cleanup even if test fails
    if (testLessonId && testModuleId) {
      try {
        await axios.delete(
          `${API_URL}/content/modules/${testModuleId}/lessons/${testLessonId}`,
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );
        await axios.delete(
          `${API_URL}/content/modules/${testModuleId}`,
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );
        console.log('Cleanup after error completed');
      } catch (cleanupError) {
        console.error('Cleanup after error failed:', cleanupError.message);
      }
    }
  }
};

testLessonApi();