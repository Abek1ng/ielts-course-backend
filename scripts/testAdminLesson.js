// scripts/testAdminLesson.js
require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
let authToken;
let testModuleId;
let testLessonId;

const testAdminLesson = async () => {
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
    console.log('\nCreating test module...');
    const moduleResponse = await axios.post(
      `${API_URL}/content/modules`,
      {
        id: `test-module-${Date.now()}`,
        title: 'IELTS Writing Task 1: Advanced Module',
        description: 'A comprehensive module for advanced IELTS Writing Task 1 preparation'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    testModuleId = moduleResponse.data.data._id;
    console.log('Test module created:', testModuleId);

    // Create complex lesson with all types of content
    console.log('\nCreating test lesson with all content types...');
    const lessonResponse = await axios.post(
      `${API_URL}/content/modules/${testModuleId}/lessons`,
      {
        title: 'Advanced Line Graph Analysis',
        contentSections: [
          {
            title: 'Understanding Complex Trends',
            paragraphs: [
              '# Introduction to Complex Line Graphs',
              'In IELTS Writing Task 1, you may encounter line graphs showing multiple trends and complex patterns.',
              '## Key Features to Analyze',
              '- Overall trends and patterns',
              '- Significant changes or turning points',
              '- Relationships between different lines',
              'Let\'s explore how to analyze these effectively.'
            ]
          },
          {
            title: 'Advanced Vocabulary',
            paragraphs: [
              '# Sophisticated Language for Trend Description',
              'Here are some advanced phrases for describing trends:',
              '1. "showed a gradual upward trend"',
              '2. "experienced a sharp decline"',
              '3. "fluctuated within a narrow range"',
              '```example',
              'The graph shows that sales experienced a dramatic surge in early 2020, followed by a gradual stabilization.',
              '```'
            ]
          }
        ],
        vocabularyExercises: [
          {
            exerciseType: 'matching',
            instructions: 'Match these advanced terms with their definitions',
            questions: [
              {
                term: 'Fluctuate',
                options: [
                  'To move up and down irregularly',
                  'To increase steadily',
                  'To decrease rapidly'
                ],
                correctAnswer: 0
              },
              {
                term: 'Plateau',
                options: [
                  'To drop suddenly',
                  'To remain at a stable level',
                  'To increase exponentially'
                ],
                correctAnswer: 1
              }
            ]
          }
        ],
        practiceExercises: [
          {
            exerciseType: 'writing',
            instructions: 'Analyze the following line graph showing global internet usage from 2000 to 2020.',
            questions: [
              'Write a complete description of the line graph in at least 150 words. Include an overview and specific details about the main trends and any significant changes.'
            ]
          }
        ]
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    testLessonId = lessonResponse.data.data._id;
    console.log('Test lesson created:', testLessonId);

    // Test retrieving the lesson
    console.log('\nTesting lesson retrieval...');
    const getLessonResponse = await axios.get(
      `${API_URL}/content/modules/${testModuleId}/lessons/${testLessonId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('Lesson retrieved successfully. Content structure:');
    console.log('- Content Sections:', getLessonResponse.data.data.contentSections.length);
    console.log('- Vocabulary Exercises:', getLessonResponse.data.data.vocabularyExercises.length);
    console.log('- Practice Exercises:', getLessonResponse.data.data.practiceExercises.length);

    // Test updating the lesson
    console.log('\nTesting lesson update...');
    await axios.put(
      `${API_URL}/content/modules/${testModuleId}/lessons/${testLessonId}`,
      {
        ...getLessonResponse.data.data,
        title: 'Advanced Line Graph Analysis (Updated)'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('Lesson updated successfully');

    console.log('\nTest completed successfully!');
    console.log('\nTest URLs:');
    console.log(`Admin lesson editor: http://localhost:3001/admin/modules/${testModuleId}/lessons/${testLessonId}`);
    console.log(`Student lesson view: http://localhost:3001/course/${testModuleId}/lessons/${testLessonId}`);

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

testAdminLesson();