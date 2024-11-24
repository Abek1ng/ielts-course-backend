// routes/progressRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const progressController = require('../controllers/progressController');

// Mark lesson as complete
router.post('/modules/:moduleId/lessons/:lessonId/complete', auth, progressController.markLessonComplete);

// Get user progress
router.get('/', auth, progressController.getUserProgress);

// Reset user progress
router.delete('/', auth, progressController.resetUserProgress);

router.post('/modules/:moduleId/lessons/:lessonId/sections', auth, progressController.updateProgress);
router.post('/modules/:moduleId/lessons/:lessonId/submit', auth, progressController.submitPracticeExercise);
router.get('/modules/:moduleId/lessons/:lessonId/submissions', auth, progressController.getSubmissions);
router.post('/modules/:moduleId/lessons/:lessonId/sections', auth, progressController.updateProgress);



module.exports = router;