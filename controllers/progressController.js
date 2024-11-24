// controllers/progressController.js
const responseHelper = require('../utils/responseHelper');
const { Lesson } = require('../models/Content');
const mongoose = require('mongoose')
const UserProgress = require('../models/UserProgress');

const updateProgress = async (req, res) => {
    try {
        const { moduleId, lessonId } = req.params;
        const { section, sectionId, currentIndex, submission } = req.body;
        const userId = req.user.userId;

        // Find existing progress
        let userProgress = await UserProgress.findOne({ user: userId });
        if (!userProgress) {
            return responseHelper.error(res, 'User progress not found', 404);
        }

        // Find module progress
        let moduleProgress = userProgress.modules.find(
            m => m.moduleId.toString() === moduleId
        );

        if (!moduleProgress) {
            moduleProgress = {
                moduleId,
                completedLessons: [],
                lessons: []
            };
            userProgress.modules.push(moduleProgress);
        }

        // Find lesson progress
        let lessonProgress = moduleProgress.lessons.find(
            l => l.lessonId.toString() === lessonId
        );

        if (!lessonProgress) {
            lessonProgress = {
                lessonId,
                completedContentSections: [],
                vocabularyCompleted: false,
                practiceCompleted: false,
                submissions: [],
                lastAccessedSection: section || 'content',
                currentContentIndex: currentIndex || 0
            };
            moduleProgress.lessons.push(lessonProgress);
        }

        // Update based on section
        switch (section) {
            case 'content':
                if (sectionId && !lessonProgress.completedContentSections.includes(sectionId)) {
                    lessonProgress.completedContentSections.push(sectionId);
                }
                if (currentIndex !== undefined) {
                    lessonProgress.currentContentIndex = currentIndex;
                }
                break;

            case 'vocabulary':
                lessonProgress.vocabularyCompleted = true;
                break;

            case 'practice':
                if (submission) {
                    lessonProgress.submissions.push({
                        exerciseId: submission.exerciseId,
                        content: submission.content,
                        wordCount: submission.wordCount,
                        timeSpent: submission.timeSpent
                    });
                }
                // Only mark practice as completed if all exercises are submitted
                const lesson = await Lesson.findById(lessonId);
                if (lesson && lesson.practiceExercises) {
                    const submittedExercises = new Set(
                        lessonProgress.submissions.map(s => s.exerciseId.toString())
                    );
                    const allExercisesSubmitted = lesson.practiceExercises.every(ex =>
                        submittedExercises.has(ex._id.toString())
                    );
                    if (allExercisesSubmitted) {
                        lessonProgress.practiceCompleted = true;
                    }
                }
                break;
        }

        // Update lastAccessed
        userProgress.lastAccessed = {
            moduleId,
            lessonId,
            timestamp: new Date()
        };

        // Check if lesson is completed
        const isLessonCompleted = await checkLessonCompletion(lessonId, lessonProgress);
        if (isLessonCompleted && !moduleProgress.completedLessons.includes(lessonId)) {
            moduleProgress.completedLessons.push(lessonId);
        }

        await userProgress.save();
        return responseHelper.success(res, userProgress);
    } catch (error) {
        console.error('Update progress error:', error);
        return responseHelper.error(res, error.message);
    }
};

// Helper function to check lesson completion
const checkLessonCompletion = async (lessonId, lessonProgress) => {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return false;

    // Check content sections
    const contentCompleted = lesson.contentSections.length ===
        lessonProgress.completedContentSections.length;

    // Check vocabulary
    const vocabularyCompleted = !lesson.vocabularyExercises?.length ||
        lessonProgress.vocabularyCompleted;

    // Check practice
    const practiceCompleted = !lesson.practiceExercises?.length ||
        lessonProgress.practiceCompleted;

    return contentCompleted && vocabularyCompleted && practiceCompleted;
};

// Get submissions for a lesson
const getSubmissions = async (req, res) => {
    try {
        const { moduleId, lessonId } = req.params;
        const userId = req.user.userId;

        const userProgress = await UserProgress.findOne({ user: userId })
            .populate('modules.lessons.submissions.feedback.givenBy', 'username');

        if (!userProgress) {
            return responseHelper.success(res, []);
        }

        const lessonProgress = userProgress.modules
            ?.find(m => m.moduleId.toString() === moduleId)
            ?.lessons?.find(l => l.lessonId.toString() === lessonId);

        return responseHelper.success(res, lessonProgress?.submissions || []);
    } catch (error) {
        console.error('Get submissions error:', error);
        return responseHelper.error(res, error.message);
    }
};



const markLessonComplete = async (req, res) => {
    try {
        const { moduleId, lessonId } = req.params;
        const userId = req.user.userId;

        // Find or create user progress
        let userProgress = await UserProgress.findOne({ user: userId });
        if (!userProgress) {
            userProgress = new UserProgress({
                user: userId,
                modules: []
            });
        }

        // Find or create module progress
        let moduleProgress = userProgress.modules.find(
            m => m.moduleId.toString() === moduleId
        );
        if (!moduleProgress) {
            moduleProgress = {
                moduleId,
                completedLessons: [],
                lessons: []
            };
            userProgress.modules.push(moduleProgress);
        }

        // Find or create lesson progress
        let lessonProgress = moduleProgress.lessons.find(
            l => l.lessonId.toString() === lessonId
        );
        if (!lessonProgress) {
            lessonProgress = {
                lessonId,
                completedContentSections: [],
                vocabularyCompleted: false,
                practiceCompleted: false,
                lastAccessedSection: 'content',
                currentContentIndex: 0
            };
            moduleProgress.lessons.push(lessonProgress);
        }

        // Update lesson completion
        if (!moduleProgress.completedLessons.includes(lessonId)) {
            moduleProgress.completedLessons.push(lessonId);
        }

        // Save changes
        await userProgress.save();

        return responseHelper.success(res, userProgress);
    } catch (error) {
        console.error('Mark lesson complete error:', error);
        return responseHelper.error(res, error.message);
    }
};

const getUserProgress = async (req, res) => {
    try {
        const progress = await UserProgress.findOne({ user: req.user.userId })
            .populate('modules.moduleId', 'title id') // Change from 'module' to 'moduleId'
            .populate('modules.lessons.lessonId', 'title') // Add population for lesson details
            .lean();

        if (!progress) {
            return responseHelper.success(res, {
                modules: [],
                lastAccessed: null
            });
        }

        return responseHelper.success(res, progress);
    } catch (error) {
        console.error('Get user progress error:', error);
        return responseHelper.error(res, error.message);
    }
};

const resetUserProgress = async (req, res) => {
    try {
        const { userId } = req.user;

        await UserProgress.deleteMany({ user: userId });

        res.json({ message: 'User progress reset successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
// controllers/progressController.js

const updateSectionProgress = async (req, res) => {
    try {
        const { moduleId, lessonId } = req.params;
        const { section, completed, data } = req.body;
        const userId = req.user.userId;

        let progress = await UserProgress.findOne({
            user: userId,
            module: moduleId,
            lesson: lessonId
        });

        if (!progress) {
            progress = new UserProgress({
                user: userId,
                module: moduleId,
                lesson: lessonId,
                completedSections: {}
            });
        }

        // Initialize completedSections if it doesn't exist
        if (!progress.completedSections) {
            progress.completedSections = {};
        }

        // Update the specific section
        progress.completedSections[section] = completed;

        // Additional data if provided
        if (data) {
            progress.sectionData = progress.sectionData || {};
            progress.sectionData[section] = data;
        }

        await progress.save();

        return res.json({
            success: true,
            data: {
                completedSections: progress.completedSections,
                sectionData: progress.sectionData
            }
        });
    } catch (error) {
        console.error('Update progress error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update progress'
        });
    }
};
const submitPracticeExercise = async (req, res) => {
    try {
        const { moduleId, lessonId } = req.params;
        const { content, exerciseId, wordCount, timeSpent } = req.body;
        const userId = req.user.userId;

        // Validate submission
        if (!content || !exerciseId) {
            return res.status(400).json({
                success: false,
                message: 'Content and exerciseId are required'
            });
        }

        // Find or create progress document
        let progress = await UserProgress.findOne({
            user: userId,
            module: moduleId,
            lesson: lessonId
        });

        if (!progress) {
            progress = new UserProgress({
                user: userId,
                module: moduleId,
                lesson: lessonId,
                completedSections: new Map(),
                submissions: []
            });
        }

        // Get exercise details from lesson
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        const exercise = lesson.practiceExercises.find(ex =>
            ex._id.toString() === exerciseId
        );

        if (!exercise) {
            return res.status(404).json({
                success: false,
                message: 'Exercise not found'
            });
        }

        // Create new submission
        const submission = {
            exerciseId,
            exerciseTitle: exercise.instructions,
            exerciseType: exercise.exerciseType,
            content,
            wordCount,
            timeSpent,
            submittedAt: new Date()
        };

        // Add submission to progress
        progress.submissions.push(submission);

        // Mark practice section as completed if all exercises have submissions
        const submittedExercises = new Set(
            progress.submissions.map(sub => sub.exerciseId)
        );

        const allExercisesSubmitted = lesson.practiceExercises.every(ex =>
            submittedExercises.has(ex._id.toString())
        );

        if (allExercisesSubmitted) {
            progress.completedSections.set('practice', true);
        }

        // Update last active
        progress.lastActive = new Date();

        // Save progress
        await progress.save();

        return res.json({
            success: true,
            message: 'Submission saved successfully',
            data: progress
        });

    } catch (error) {
        console.error('Submission error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save submission'
        });
    }
};

module.exports = {
    markLessonComplete,
    getUserProgress,
    resetUserProgress,
    updateSectionProgress,
    updateProgress,
    getSubmissions,
    submitPracticeExercise,
    checkLessonCompletion
};

