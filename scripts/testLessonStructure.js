// scripts/testLessonStructure.js
require('dotenv').config();
const mongoose = require('mongoose');
const { Module, Lesson } = require('../models/Content');
const UserProgress = require('../models/UserProgress');
const User = require('../models/User');

const testLessonStructure = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Create test user if not exists
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        status: 'active'
      });
      console.log('Test user created');
    }

    // Create test module
    const testModule = await Module.create({
      id: 'test-module',
      title: 'Test Module',
      description: 'Test module description',
      createdBy: testUser._id
    });
    console.log('Test module created');

    // Create test lesson with new structure
    const testLesson = await Lesson.create({
      title: 'Test Lesson',
      moduleId: testModule._id,
      contentSections: [{
        title: 'Introduction',
        paragraphs: [
          'This is a test paragraph.',
          'This is another paragraph.'
        ]
      }],
      vocabularyExercises: [{
        exerciseType: 'matching',
        instructions: 'Match the following terms',
        questions: [{
          term: 'Test term',
          options: ['Option 1', 'Option 2'],
          correctAnswer: 0
        }]
      }],
      practiceExercises: [{
        exerciseType: 'writing',
        instructions: 'Write a response',
        questions: ['Write about the following topic']
      }],
      createdBy: testUser._id
    });
    console.log('Test lesson created');

    // Update module to include lesson
    await Module.findByIdAndUpdate(
      testModule._id,
      { $push: { lessons: testLesson._id } }
    );
    console.log('Module updated with lesson');

    // Test progress tracking
    const progress = await UserProgress.create({
      user: testUser._id,
      module: testModule._id,
      lesson: testLesson._id,
      completed: true
    });
    console.log('Progress tracking created');

    // Verify the created data
    const verifyLesson = await Lesson.findById(testLesson._id);
    console.log('\nVerifying lesson structure:');
    console.log(JSON.stringify(verifyLesson, null, 2));

    const verifyProgress = await UserProgress.findById(progress._id);
    console.log('\nVerifying progress tracking:');
    console.log(JSON.stringify(verifyProgress, null, 2));

    // Clean up test data
    await Promise.all([
      Lesson.findByIdAndDelete(testLesson._id),
      Module.findByIdAndDelete(testModule._id),
      UserProgress.findByIdAndDelete(progress._id)
    ]);
    console.log('\nTest data cleaned up');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

testLessonStructure();