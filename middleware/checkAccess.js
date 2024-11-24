const User = require('../models/User');

const checkAccess = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check user status
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is not active'
      });
    }

    // Check access expiration
    if (!user.accessUntil || new Date() > user.accessUntil) {
      return res.status(403).json({
        success: false,
        message: 'Your access has expired'
      });
    }

    // Add access expiration to request for potential use in routes
    req.accessUntil = user.accessUntil;
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking access status'
    });
  }
};

module.exports = checkAccess;