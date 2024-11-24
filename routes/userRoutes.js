const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Protected routes - require authentication
router.use(auth);

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const { username, email } = req.body;
    
    // Check if email is already taken
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: req.user.userId } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: { username, email } },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Check access status
router.get('/access-status', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('status accessUntil');

    const hasAccess = user.status === 'active' && 
                     user.accessUntil && 
                     new Date() < user.accessUntil;

    const daysRemaining = user.accessUntil ? 
      Math.ceil((user.accessUntil - new Date()) / (1000 * 60 * 60 * 24)) : 0;

    res.json({
      success: true,
      data: {
        status: user.status,
        hasAccess,
        accessUntil: user.accessUntil,
        daysRemaining: Math.max(0, daysRemaining)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check access status'
    });
  }
});

// Change password
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId);
    const isValidPassword = await user.comparePassword(currentPassword);

    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

module.exports = router;