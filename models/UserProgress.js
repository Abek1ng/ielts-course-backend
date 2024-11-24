// models/UserProgress.js
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    exerciseId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    content: String,
    wordCount: Number,
    timeSpent: Number,
    submittedAt: {
        type: Date,
        default: Date.now
    },
    feedback: [{
        content: String,
        givenBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        givenAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { _id: true });

const lessonProgressSchema = new mongoose.Schema({
    lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true
    },
    completedContentSections: [{
        type: mongoose.Schema.Types.ObjectId
    }],
    vocabularyCompleted: {
        type: Boolean,
        default: false
    },
    practiceCompleted: {
        type: Boolean,
        default: false
    },
    submissions: [submissionSchema],
    lastAccessedSection: {
        type: String,
        enum: ['content', 'vocabulary', 'practice'],
        default: 'content'
    },
    currentContentIndex: {
        type: Number,
        default: 0
    }
}, { _id: false });


const moduleProgressSchema = new mongoose.Schema({
    moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        required: true
    },
    completedLessons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson'
    }],
    lessons: [lessonProgressSchema]
}, { _id: false });

const userProgressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    modules: [moduleProgressSchema],
    lastAccessed: {
        moduleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Module'
        },
        lessonId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lesson'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }
}, {
    timestamps: true
});

// Add index for performance
userProgressSchema.index({ user: 1 });
userProgressSchema.index({ 'modules.moduleId': 1 });

// Virtual for total progress
userProgressSchema.virtual('totalProgress').get(function () {
    if (!this.modules.length) return 0;

    const totalCompleted = this.modules.reduce((sum, module) =>
        sum + module.completedLessons.length, 0);

    const totalLessons = this.modules.reduce((sum, module) =>
        sum + module.lessons.length, 0);

    return totalLessons ? Math.round((totalCompleted / totalLessons) * 100) : 0;
});

// Ensure virtuals are included in response
userProgressSchema.set('toJSON', { virtuals: true });
userProgressSchema.set('toObject', { virtuals: true });

const UserProgress = mongoose.model('UserProgress', userProgressSchema);

module.exports = UserProgress;