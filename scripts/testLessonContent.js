// scripts/testLessonContent.js
require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
let authToken;
let testModuleId;
let testLessonId;

const testLessonContent = async () => {
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
                title: 'IELTS Writing Task 1: Introduction to Data Visualization',
                description: 'A comprehensive module introducing various types of data visualizations in IELTS Writing Task 1'
            },
            {
                headers: { Authorization: `Bearer ${authToken}` }
            }
        );

        testModuleId = moduleResponse.data.data._id;
        console.log('Test module created:', testModuleId);

        // Create test lesson with content sections
        console.log('\nCreating test lesson...');
        const lessonResponse = await axios.post(
            `${API_URL}/content/modules/${testModuleId}/lessons`,
            {
                title: 'Mastering Line Graphs and Bar Charts',
                contentSections: [
                    {
                        title: 'Introduction to Line Graphs',
                        paragraphs: [
                            '# What is a Line Graph?',
                            'Line graphs are used to show trends over time, making them a common feature in IELTS Writing Task 1.',
                            '## Key Features',
                            '- Trends over time',
                            '- Changes in values',
                            '- Comparisons across different periods'
                        ]
                    },
                    {
                        title: 'Introduction to Bar Charts',
                        paragraphs: [
                            '# What is a Bar Chart?',
                            'Bar charts are used to compare different categories of data, often over a specific period.',
                            '## Key Features',
                            '- Categories of comparison',
                            '- Visual representation of differences',
                            '- Trends across different groups'
                        ]
                    },
                    {
                        title: 'Useful Vocabulary for Graphs and Charts',
                        paragraphs: [
                            '# Vocabulary for Describing Data',
                            'Here are some essential terms for describing line graphs and bar charts:',
                            '1. Increase: rise, surge, growth',
                            '2. Decrease: fall, drop, decline',
                            '3. Fluctuate: vary, change',
                            '4. Peak: reach the highest point',
                            '5. Plateau: remain stable at a high level',
                            '```example',
                            'The chart shows that sales peaked in 2021 before declining in the following year.',
                            'The line graph illustrates a steady increase in population over the decade.',
                            '```'
                        ]
                    },
                    {
                        title: 'Practice Examples',
                        paragraphs: [
                            '# Practice Exercise 1: Line Graph',
                            'Look at this example:',
                            '- The line graph shows the population growth over a ten-year period.',
                            '- There is a gradual increase in the population from 2010 to 2020.',
                            '- The growth rate peaks in 2015 before stabilizing towards the end of the decade.',
                            'Try describing these changes using the vocabulary we learned.',
                            '# Practice Exercise 2: Bar Chart',
                            'Look at this example:',
                            '- The bar chart compares the sales figures of three products.',
                            '- There is a significant rise in the sales of Product A.',
                            '- Product B remains stable throughout the period, while Product C shows a decline.',
                            'Use the vocabulary to describe these trends effectively.'
                        ]
                    }
                ],
                vocabularyExercises: [
                    {
                        exerciseType: 'matching',
                        instructions: 'Match the terms with their definitions',
                        questions: [
                            {
                                term: 'Fluctuate',
                                options: ['To vary or change frequently', 'To increase steadily', 'To reach a low point'],
                                correctAnswer: 0
                            },
                            {
                                term: 'Plateau',
                                options: ['To remain stable at a high level', 'To decrease sharply', 'To rise gradually'],
                                correctAnswer: 0
                            }
                        ]
                    }
                ],
                practiceExercises: [
                    {
                        exerciseType: 'writing',
                        instructions: 'Look at the line graph showing average temperatures in different months and write a description of the main trends.',
                        data: {
                            image: true, // This would be replaced with actual image data in a real implementation
                        },
                        questions: [
                            'Write at least 150 words describing the trends shown in the line graph. Include an overview and key features. Use appropriate language to describe changes and make comparisons between different months.'
                        ]
                    },
                    {
                        exerciseType: 'writing',
                        instructions: 'Analyze the bar chart showing the distribution of various job sectors in a city.',
                        data: {
                            image: true,
                        },
                        questions: [
                            'In at least 150 words, describe the different job sectors and their respective proportions. Include an overview and specific details about significant differences.'
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
        console.log('\nTest data created successfully!');
        console.log('\nYou can now test the lesson at this URL:');
        console.log(`http://localhost:3001/course/${testModuleId}/lessons/${testLessonId}`);

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

testLessonContent();
