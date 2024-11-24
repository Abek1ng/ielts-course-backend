const User = require('../models/User');
const emailService = require('../utils/emailService');
const UserProgress = require('../models/UserProgress');


const formatDate = (date) => {
  return new Date(date).toLocaleString('ru-KZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Almaty'
  });
};
const calculateOverallProgress = (progress) => {
  if (!progress.completedSections) return 0;
  const sections = Object.values(progress.completedSections);
  if (sections.length === 0) return 0;
  return Math.round((sections.filter(Boolean).length / sections.length) * 100);
};
// Utility function to set end of day in Kazakhstan time
const setEndOfDay = (date) => {
  // Create date in Kazakhstan timezone (UTC+6)
  const kzDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Almaty' }));
  kzDate.setHours(22, 59, 59, 999);
  return kzDate;
};
const adminController = {
  // Get all pending users
  getPendingUsers: async (req, res) => {
    try {
      const pendingUsers = await User.find({ status: 'pending' })
        .select('-password')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: pendingUsers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending users'
      });
    }
  },

  // Grant access to user
  grantAccess: async (req, res) => {
    try {
      const { userId, durationDays } = req.body;

      // Calculate access expiration
      const accessDate = new Date();
      accessDate.setDate(accessDate.getDate() + Number(durationDays));
      const accessUntil = setEndOfDay(accessDate);

      // Update user
      const user = await User.findByIdAndUpdate(
        userId,
        {
          status: 'active',
          accessUntil: accessUntil
        },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      if (user.isAdmin == true) {
        return res.status(403).json({
          success: false,
          message: 'Cannot modify admin access'
        })
      }
      // Format the date for display
      const formattedDate = formatDate(accessUntil);

      // Send activation email without awaiting
      emailService.sendEmail({
        to: user.email,
        subject: 'IELTS Course Access Granted',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Access Granted!</h2>
            <p>Dear ${user.username},</p>
            <p>Your access to the IELTS course has been granted!</p>
            <p>Details:</p>
            <ul style="list-style-type: none; padding-left: 0;">
              <li>📅 Access valid until: <strong>${formattedDate}</strong></li>
              <li>✅ You can now log in and access all course materials</li>
            </ul>
            <div style="margin: 25px 0;">
              <a href="${process.env.SITE_URL}/login" 
                 style="background-color: #4CAF50; 
                        color: white; 
                        padding: 12px 25px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold;">
                Access Course
              </a>
            </div>
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>IELTS Course Team</strong>
            </p>
          </div>
        `
      }).catch(error => {
        console.error('Failed to send access granted email:', error);
      });

      // Transform the response to include formatted date
      const responseData = {
        ...user.toObject(),
        formattedAccessUntil: formattedDate
      };

      res.json({
        success: true,
        message: 'Access granted successfully',
        data: responseData
      });

    } catch (error) {
      console.error('Grant access error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to grant access'
      });
    }
  },

  // Get all users
  getAllUsers: async (req, res) => {
    try {
      const users = await User.find()
        .select('-password')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }
  },

  // Revoke user access
  revokeAccess: async (req, res) => {
    try {
      const { userId } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        {
          status: 'inactive',
          accessUntil: null
        },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      if (user.isAdmin == true) {
        return res.status(403).json({
          success: false,
          message: 'Cannot modify admin access'
        })
      }
      res.json({
        success: true,
        message: 'Access revoked successfully',
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to revoke access'
      });
    }
  },

  getStudentProgress: async (req, res) => {
    try {
      console.log('Fetching student progress...');

      // Find all non-admin users first
      const students = await User.find({ isAdmin: false }).select('_id');
      const studentIds = students.map(student => student._id);

      // Get progress only for non-admin users
      const progress = await UserProgress.find({
        user: { $in: studentIds }
      })
        .populate('user', 'username email')
        .populate('module', 'title')
        .populate('lesson', 'title')
        .lean();

      const formattedProgress = progress.map(p => ({
        id: p._id.toString(),
        userId: p.user?._id.toString(),
        username: p.user?.username || 'Unknown User',
        email: p.user?.email || 'No Email',
        moduleTitle: p.module?.title || 'Not Started',
        lessonTitle: p.lesson?.title || 'No Lesson',
        completed: p.completed || false,
        completedSections: p.completedSections || {},
        lastActive: p.lastActive || new Date(),
        submissions: p.submissions?.length || 0,
        overallProgress: calculateOverallProgress(p)
      }));

      // Group progress by user if there are multiple entries
      const userProgress = formattedProgress.reduce((acc, curr) => {
        if (!acc[curr.userId]) {
          acc[curr.userId] = {
            ...curr,
            modules: []
          };
        }
        if (curr.moduleTitle !== 'Not Started') {
          acc[curr.userId].modules.push({
            title: curr.moduleTitle,
            lesson: curr.lessonTitle,
            completed: curr.completed
          });
        }
        return acc;
      }, {});

      return res.json({
        success: true,
        data: Object.values(userProgress)
      });
    } catch (error) {
      console.error('Get student progress error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch student progress',
        error: error.message
      });
    }
  },

  getStudentDetails: async (req, res) => {
    try {
      const { studentId } = req.params;

      const progress = await UserProgress.find({ user: studentId })
        .populate('user', 'username email')
        .populate('module', 'title')
        .populate('lesson', 'title')
        .populate({
          path: 'submissions.exerciseId',
          select: 'title'
        })
        .populate({
          path: 'submissions.feedback.givenBy',
          select: 'username'
        })
        .lean();

      if (!progress.length) {
        return res.status(404).json({
          success: false,
          message: 'No progress found for this student'
        });
      }

      const formattedProgress = {
        user: progress[0].user,
        modules: progress.map(p => ({
          id: p.module?._id,
          title: p.module?.title,
          lesson: {
            id: p.lesson?._id,
            title: p.lesson?.title
          },
          completed: p.completed,
          completedSections: p.completedSections,
          lastActive: p.lastActive,
          submissions: p.submissions?.map(s => ({
            id: s._id,
            exerciseTitle: s.exerciseId?.title,
            content: s.content,
            wordCount: s.wordCount,
            submittedAt: s.submittedAt,
            feedback: s.feedback?.map(f => ({
              content: f.content,
              givenBy: f.givenBy?.username,
              givenAt: f.givenAt
            }))
          }))
        }))
      };

      return res.json({
        success: true,
        data: formattedProgress
      });
    } catch (error) {
      console.error('Get student details error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch student details',
        error: error.message
      });
    }
  },


  gradeSubmission: async (req, res) => {
    try {
      const { submissionId } = req.params;
      const { grade, comments } = req.body;

      const progress = await UserProgress.findOne({
        'submissions._id': submissionId
      });

      if (!progress) {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }

      // Update the submission
      const submission = progress.submissions.id(submissionId);
      submission.grade = grade;
      if (comments) {
        submission.feedback.push({
          content: comments,
          givenBy: req.user.userId,
          givenAt: new Date()
        });
      }

      await progress.save();

      return res.json({
        success: true,
        data: submission
      });
    } catch (error) {
      console.error('Grade submission error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to grade submission'
      });
    }
  },

  addFeedback: async (req, res) => {
    try {
      const { submissionId } = req.params;
      const { feedback } = req.body;

      const progress = await UserProgress.findOne({
        'submissions._id': submissionId
      });

      if (!progress) {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }

      const submission = progress.submissions.id(submissionId);
      submission.feedback.push({
        content: feedback,
        givenBy: req.user.userId,
        givenAt: new Date()
      });

      await progress.save();

      return res.json({
        success: true,
        data: submission
      });
    } catch (error) {
      console.error('Add feedback error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to add feedback'
      });
    }
  },
};

module.exports = adminController;