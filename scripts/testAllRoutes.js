// scripts/testAllRoutes.js
require('dotenv').config();
const axios = require('axios');
const colors = require('colors');

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
let authToken;
let adminAuthToken;
let testUserId;
let testModuleId;
let testLessonId;

// Helper function to generate unique IDs
const generateUniqueId = (prefix) => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Test result counter
const testResults = {
    passed: 0,
    failed: 0,
    total: 0
};

// Helper function for logging test results
const logTest = (testName, success, error = null) => {
    testResults.total++;
    if (success) {
        testResults.passed++;
        console.log(colors.green(`✓ ${testName}`));
    } else {
        testResults.failed++;
        console.log(colors.red(`✗ ${testName}`));
        console.log(colors.yellow('Test failed details:'));
        if (error) {
            if (error.response) {
                console.log(colors.yellow('Status:', error.response.status));
                console.log(colors.yellow('Response:', JSON.stringify(error.response.data, null, 2)));
            } else {
                console.log(colors.yellow(JSON.stringify(error, null, 2)));
            }
        }
    }
    // Add a line break after each test for better readability
    console.log('');
};

// Helper function to validate response
const validateResponse = (response) => {
    if (!response) return false;

    // Check if response has a status code
    if (response.status !== 200 && response.status !== 201) return false;

    // If response has data property, check if it's properly structured
    if (response.data) {
        // Some responses might not have success property but still be valid
        if (response.data.hasOwnProperty('success') && !response.data.success) return false;
    }

    return true;
};
// Main test function
const testAllRoutes = async () => {
    try {
        console.log(colors.cyan('\n=== Testing Authentication Routes ===\n'));

        // Test registration
        try {
            const uniqueEmail = `test${Date.now()}@example.com`;
            const registerResponse = await axios.post(`${API_URL}/auth/register`, {
                username: `testuser${Date.now()}`,
                email: uniqueEmail,
                password: 'Test123!'
            });
            logTest('Register new user', registerResponse.data.success);
        } catch (error) {
            logTest('Register new user', false, error.response?.data);
        }

        // Test admin login
        try {
            const adminLoginResponse = await axios.post(`${API_URL}/auth/login`, {
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            });
            adminAuthToken = adminLoginResponse.data.token;
            logTest('Admin login', true);
        } catch (error) {
            logTest('Admin login', false, error.response?.data);
            // Exit if admin login fails as it's required for other tests
            throw new Error('Admin login failed - stopping tests');
        }

        console.log(colors.cyan('\n=== Testing Admin Routes ===\n'));

        // Test getting all users
        try {
            const usersResponse = await axios.get(
                `${API_URL}/admin/users`,
                { headers: { Authorization: `Bearer ${adminAuthToken}` } }
            );
            logTest('Get all users', usersResponse.data.success);
        } catch (error) {
            logTest('Get all users', false, error.response?.data);
        }

        // Test getting pending users
        try {
            const pendingUsersResponse = await axios.get(
                `${API_URL}/admin/users/pending`,
                { headers: { Authorization: `Bearer ${adminAuthToken}` } }
            );
            logTest('Get pending users', pendingUsersResponse.data.success);
        } catch (error) {
            logTest('Get pending users', false, error.response?.data);
        }

        console.log(colors.cyan('\n=== Testing Content Management Routes ===\n'));

        // Test module creation
        try {
            const uniqueModuleId = generateUniqueId('test-module');
            const moduleResponse = await axios.post(
                `${API_URL}/content/modules`,
                {
                    id: uniqueModuleId,
                    title: 'Test Module',
                    description: 'Test module description'
                },
                { headers: { Authorization: `Bearer ${adminAuthToken}` } }
            );
            testModuleId = moduleResponse.data.data._id;
            logTest('Create module', moduleResponse.data.success);
        } catch (error) {
            logTest('Create module', false, error.response?.data);
        }

        // Test getting all modules
        try {
            const modulesResponse = await axios.get(
                `${API_URL}/content/modules`,
                { headers: { Authorization: `Bearer ${adminAuthToken}` } }
            );
            logTest('Get all modules', modulesResponse.data.success);
        } catch (error) {
            logTest('Get all modules', false, error.response?.data);
        }

        // Test lesson creation
        if (testModuleId) {
            try {
                const lessonResponse = await axios.post(
                    `${API_URL}/content/modules/${testModuleId}/lessons`,
                    {
                        title: 'Test Lesson',
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
                            instructions: 'Test instructions',
                            questions: ['Test question']
                        }]
                    },
                    { headers: { Authorization: `Bearer ${adminAuthToken}` } }
                );
                testLessonId = lessonResponse.data.data._id;
                logTest('Create lesson', lessonResponse.data.success);
            } catch (error) {
                logTest('Create lesson', false, error.response?.data);
            }
        }

        // Test getting lessons for a module
        if (testModuleId) {
            try {
                const lessonsResponse = await axios.get(
                    `${API_URL}/content/modules/${testModuleId}/lessons`,
                    { headers: { Authorization: `Bearer ${adminAuthToken}` } }
                );
                logTest('Get module lessons', lessonsResponse.data.success);
            } catch (error) {
                logTest('Get module lessons', false, error.response?.data);
            }
        }

        // Test updating a lesson
        if (testModuleId && testLessonId) {
            try {
                const updateResponse = await axios.put(
                    `${API_URL}/content/modules/${testModuleId}/lessons/${testLessonId}`,
                    {
                        title: 'Updated Test Lesson',
                        contentSections: [{
                            title: 'Updated Section',
                            paragraphs: ['Updated paragraph']
                        }]
                    },
                    { headers: { Authorization: `Bearer ${adminAuthToken}` } }
                );
                logTest('Update lesson', updateResponse.data.success);
            } catch (error) {
                logTest('Update lesson', false, error.response?.data);
            }
        }

        console.log(colors.cyan('\n=== Testing Progress Routes ===\n'));

        // Test marking lesson as complete
        if (testModuleId && testLessonId) {
            try {
                const progressResponse = await axios.post(
                    `${API_URL}/progress/modules/${testModuleId}/lessons/${testLessonId}/complete`,
                    {},
                    { headers: { Authorization: `Bearer ${adminAuthToken}` } }
                );

                logTest('Mark lesson complete', validateResponse(progressResponse));
            } catch (error) {
                logTest('Mark lesson complete', false, error);
            }
        }

        // Test getting user progress
        try {
            const progressResponse = await axios.get(
                `${API_URL}/progress`,
                { headers: { Authorization: `Bearer ${adminAuthToken}` } }
            );

            logTest('Get user progress', validateResponse(progressResponse));
        } catch (error) {
            logTest('Get user progress', false, error);
        }

        console.log(colors.cyan('\n=== Cleanup ===\n'));

        // Cleanup - Delete lesson
        if (testModuleId && testLessonId) {
            try {
                await axios.delete(
                    `${API_URL}/content/modules/${testModuleId}/lessons/${testLessonId}`,
                    { headers: { Authorization: `Bearer ${adminAuthToken}` } }
                );
                logTest('Delete lesson', true);
            } catch (error) {
                logTest('Delete lesson', false, error.response?.data);
            }
        }

        // Cleanup - Delete module
        if (testModuleId) {
            try {
                await axios.delete(
                    `${API_URL}/content/modules/${testModuleId}`,
                    { headers: { Authorization: `Bearer ${adminAuthToken}` } }
                );
                logTest('Delete module', true);
            } catch (error) {
                logTest('Delete module', false, error.response?.data);
            }
        }

    } catch (error) {
        console.error(colors.red('\nTest suite failed:'), error.message);
    } finally {
        // Print test summary
        console.log(colors.cyan('\n=== Test Summary ===\n'));
        console.log(colors.white(`Total tests: ${testResults.total}`));
        console.log(colors.green(`Passed: ${testResults.passed}`));
        console.log(colors.red(`Failed: ${testResults.failed}`));
        console.log(colors.yellow(`Success rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`));
    }
};

// Run tests
testAllRoutes();