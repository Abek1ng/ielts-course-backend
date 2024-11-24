// routes/contentRoutes.js
const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const auth = require('../middleware/auth');
const checkAdmin = require('../middleware/checkAdmin');

// Module routes
router.get('/modules', auth, contentController.getModules);
router.get('/modules/:moduleId', auth, contentController.getModuleById); 
router.post('/modules', auth, checkAdmin, contentController.createModule);
router.put('/modules/:moduleId', auth, checkAdmin, contentController.updateModule);
router.delete('/modules/:moduleId', auth, checkAdmin, contentController.deleteModule);

// Lesson routes
router.get('/modules/:moduleId/lessons', auth, contentController.getLessons);
router.get('/modules/:moduleId/lessons/:lessonId', auth, contentController.getLessonById); 
router.post('/modules/:moduleId/lessons', auth, checkAdmin, contentController.createLesson);
router.put('/modules/:moduleId/lessons/:lessonId', auth, checkAdmin, contentController.updateLesson);
router.delete('/modules/:moduleId/lessons/:lessonId', auth, checkAdmin, contentController.deleteLesson);

module.exports = router;