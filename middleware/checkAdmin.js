const User = require('../models/User');

const checkAdmin = async (req, res, next) => {
  try {
    // Get user from database to ensure up-to-date admin status
    const user = await User.findById(req.user.userId);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking admin status'
    });
  }
};

module.exports = checkAdmin;