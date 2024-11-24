const jwt = require('jsonwebtoken');
const User = require('../models/User');
const emailService = require('../utils/emailService');
const UserProgress = require('../models/UserProgress');
const authController = {
  // Register new user
  register: async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // Check if user already exists
      const userExists = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'User with this email or username already exists'
        });
      }

      // Create new user
      const user = new User({
        username,
        email,
        password,
        status: 'pending'
      });

      await user.save();

      const userProgress = new UserProgress({
        user: user._id,
        modules: [],
        lastAccessed: null
      });

      await userProgress.save();

      // Send email to admin without awaiting
      emailService.sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: 'New User Registration',
        html: `
          <h2>New User Registration Request</h2>
          <p>A new user has registered and is awaiting approval:</p>
          <p><strong>Username:</strong> ${username}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p>Please login to the admin panel to review this registration.</p>
        `
      }).catch(console.error); // Log any email errors

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please wait for admin approval.'
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed. Please try again.'
      });
    }
  },

  // User login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if user is approved
      if (user.status === 'pending') {
        return res.status(403).json({
          success: false,
          message: 'Your account is pending approval'
        });
      }

      if (user.status === 'inactive') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = jwt.sign(
        {
          userId: user._id,
          isAdmin: user.isAdmin
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          status: user.status,
          isAdmin: user.isAdmin,
          accessUntil: user.accessUntil
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.'
      });
    }
  },

  // Password reset request
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No user found with this email'
        });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Save reset token and expiry
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
      await user.save();

      // Send reset email without awaiting
      emailService.sendEmail({
        to: email,
        subject: 'Password Reset Request',
        html: `
          <h2>Password Reset Request</h2>
          <p>You have requested to reset your password. Click the link below to reset it:</p>
          <a href="${process.env.SITE_URL}/reset-password/${resetToken}">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      }).catch(console.error);

      res.json({
        success: true,
        message: 'Password reset email sent'
      });

    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process password reset request'
      });
    }
  }
};

module.exports = authController;