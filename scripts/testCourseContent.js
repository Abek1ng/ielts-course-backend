// scripts/testCourseContent.js
require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
let authToken;

const modules = [
  {
    id: 'introduction',
    title: 'Introduction to Writing Task 1',
    description: 'Learn the fundamentals of IELTS Writing Task 1, including task requirements, scoring criteria, and response structure.'
  },
  {
    id: 'graphs-charts',
    title: 'Line Graphs and Bar Charts',
    description: 'Master describing trends, comparing data, and analyzing changes over time in graphs and charts.'
  },
  {
    id: 'pie-tables',
    title: 'Pie Charts and Tables',
    description: 'Learn how to describe proportions, percentages, and tabulated data effectively.'
  },
  {
    id: 'process-maps',
    title: 'Process Diagrams and Maps',
    description: 'Understand how to describe processes, cycles, and geographical changes.'
  }
];

const introductionLessons = [
  {
    title: 'Understanding Task Requirements',
    contentSections: [
      {
        title: 'Task Overview',
        paragraphs: [
          '# What is IELTS Writing Task 1?',
          'In IELTS Writing Task 1, you need to:',
          '- Summarize visual data (graphs, charts, diagrams, etc)',
          '- Write at least 150 words',
          '- Complete the task in 20 minutes',
          '- Provide an objective description without opinions'
        ]
      },
      {
        title: 'Band Score Criteria',
        paragraphs: [
          '# Assessment Criteria',
          'Your writing is assessed on:',
          '1. Task Achievement',
          '2. Coherence and Cohesion',
          '3. Lexical Resource',
          '4. Grammatical Range and Accuracy'
        ]
      }
    ],
    vocabularyExercises: [
      {
        exerciseType: 'matching',
        instructions: 'Match these key terms with their definitions',
        questions: [
          {
            term: 'Trend',
            options: ['A general direction in which something develops', 'A specific point of data', 'A type of graph'],
            correctAnswer: 0
          }
        ]
      }
    ],
    practiceExercises: [
      {
        exerciseType: 'writing',
        instructions: 'Look at the line graph showing energy production and write a 150-word response.',
        questions: ['Write a complete response for this graph. Include an overview and key features.']
      }
    ]
  }
];

const graphsLessons = [
  {
    title: 'Describing Line Graphs',
    contentSections: [
      {
        title: 'Understanding Line Graphs',
        paragraphs: [
          '# Key Features of Line Graphs',
          '- Overall trends',
          '- High and low points',
          '- Significant changes',
          '- Period comparisons'
        ]
      },
      {
        title: 'Useful Language',
        paragraphs: [
          '# Vocabulary for Trends',
          '- Increase: rise, grow, climb',
          '- Decrease: fall, decline, drop',
          '- No change: remain stable, stay constant'
        ]
      }
    ]
  }
];

// Test function to create content
const createTestContent = async () => {
  try {
    // Login as admin
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    });
    authToken = loginResponse.data.token;

    // Create modules
    for (const module of modules) {
      console.log(`Creating module: ${module.title}`);
      const moduleResponse = await axios.post(
        `${API_URL}/content/modules`,
        module,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      // Add lessons to each module
      const moduleId = moduleResponse.data.data._id;
      const lessons = module.id === 'introduction' ? introductionLessons : graphsLessons;
      
      for (const lesson of lessons) {
        console.log(`Creating lesson: ${lesson.title}`);
        await axios.post(
          `${API_URL}/content/modules/${moduleId}/lessons`,
          lesson,
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );
      }
    }

    console.log('Test content created successfully!');
  } catch (error) {
    console.error('Error creating test content:', error.response?.data || error);
  }
};

createTestContent();