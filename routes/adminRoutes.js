const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const checkAdmin = require('../middleware/checkAdmin');
const User = require('../models/User');
// All admin routes require authentication and admin privileges
router.use(auth, checkAdmin);

// User management routes
router.get('/users', adminController.getAllUsers);
router.get('/users/pending', adminController.getPendingUsers);
router.post('/users/grant-access', adminController.grantAccess);
router.post('/users/revoke-access', adminController.revokeAccess);
router.get('/progress', auth, checkAdmin, adminController.getStudentProgress);
router.get('/students/:studentId/progress', auth, checkAdmin, adminController.getStudentProgress);
router.post('/submissions/:submissionId/grade', auth, checkAdmin, adminController.gradeSubmission);
router.post('/submissions/:submissionId/feedback', auth, checkAdmin, adminController.addFeedback);
// Input validation middleware for granting access
router.use('/users/grant-access', (req, res, next) => {
  const { userId, durationDays } = req.body;

  if (!userId || !durationDays) {
    return res.status(400).json({
      success: false,
      message: 'UserId and duration are required'
    });
  }

  if (isNaN(durationDays) || durationDays <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Duration must be a positive number'
    });
  }

  next();
});

// Admin dashboard statistics
router.get('/statistics', auth, checkAdmin, async (req, res) => {
  try {
    console.log('Starting statistics calculation (excluding admins)...');

    // Verify database connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }

    // Get current date and next week for expiring calculation
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    // Base query to exclude admin users
    const nonAdminQuery = { isAdmin: false };

    // Collect all statistics
    console.log('Fetching non-admin user statistics...');
    const [pendingUsers, activeUsers, totalUsers, expiringThisWeek] = await Promise.all([
      User.countDocuments({ ...nonAdminQuery, status: 'pending' }),
      User.countDocuments({ ...nonAdminQuery, status: 'active' }),
      User.countDocuments(nonAdminQuery),
      User.countDocuments({
        ...nonAdminQuery,
        status: 'active',
        accessUntil: {
          $gt: now,
          $lt: nextWeek
        }
      })
    ]);

    const statistics = {
      pendingUsers,
      activeUsers,
      totalUsers,
      expiringThisWeek
    };

    console.log('Non-admin statistics calculated successfully:', statistics);

    return res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    console.error('Error in statistics endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.get('/submissions/:id', auth, checkAdmin, async (req, res) => {
  try {
    const submission = await UserProgress.findById(req.params.id)
      .populate('user')
      .populate('module')
      .populate('lesson');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    res.json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/submissions/:id/feedback', auth, checkAdmin, async (req, res) => {
  try {
    const { feedback } = req.body;
    const submission = await UserProgress.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          feedback: {
            content: feedback,
            givenBy: req.user.userId,
            givenAt: new Date()
          }
        }
      },
      { new: true }
    );

    res.json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
module.exports = router;