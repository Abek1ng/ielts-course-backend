const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['login', 'register', 'access_granted', 'access_expired', 'password_reset']
  },
  details: {
    type: mongoose.Schema.Schema.Types.Mixed,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ip: String,
  userAgent: String
}, {
  timestamps: true
});

// Index for efficient querying
activitySchema.index({ user: 1, type: 1, timestamp: -1 });

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;