// controllers/contentController.js
const { Module, Lesson } = require('../models/Content');
const responseHelper = require('../utils/responseHelper');

const contentController = {
    // Module Operations
    getModules: async (req, res) => {
        try {
            const modules = await Module.find()
                .populate({
                    path: 'lessons',
                    select: 'title type'
                })
                .sort('order');

            return responseHelper.success(res, modules);
        } catch (error) {
            console.error('Get modules error:', error);
            return responseHelper.error(res, error.message);
        }
    },

    getModuleById: async (req, res) => {
        try {
            const { moduleId } = req.params;

            const module = await Module.findById(moduleId)
                .populate({
                    path: 'lessons',
                    select: 'title type'
                });

            if (!module) {
                return responseHelper.error(res, 'Module not found', 404);
            }

            return responseHelper.success(res, module);
        } catch (error) {
            console.error('Get module by id error:', error);
            return responseHelper.error(res, error.message);
        }
    },

    createModule: async (req, res) => {
        try {
            const { id, title, description } = req.body;

            const moduleData = {
                id,
                title,
                description,
                createdBy: req.user.userId
            };

            const module = await Module.create(moduleData);

            return responseHelper.success(res, {
                _id: module._id,
                id: module.id,
                title: module.title,
                description: module.description
            }, 'Module created successfully', 201);
        } catch (error) {
            console.error('Create module error:', error);
            return responseHelper.error(res, error.message);
        }
    },

    updateModule: async (req, res) => {
        try {
            const { moduleId } = req.params;
            const updateData = {
                ...req.body,
                updatedBy: req.user.userId
            };

            const module = await Module.findByIdAndUpdate(
                moduleId,
                updateData,
                { new: true }
            ).populate('lessons');

            if (!module) {
                return responseHelper.error(res, 'Module not found', 404);
            }

            return responseHelper.success(res, module);
        } catch (error) {
            console.error('Update module error:', error);
            return responseHelper.error(res, error.message);
        }
    },

    deleteModule: async (req, res) => {
        try {
            const { moduleId } = req.params;

            // Delete associated lessons
            await Lesson.deleteMany({ moduleId });

            // Delete the module
            const deletedModule = await Module.findByIdAndDelete(moduleId);

            if (!deletedModule) {
                return responseHelper.error(res, 'Module not found', 404);
            }

            return responseHelper.success(res, null, 'Module deleted successfully');
        } catch (error) {
            console.error('Delete module error:', error);
            return responseHelper.error(res, error.message);
        }
    },

    // Lesson Operations
    getLessons: async (req, res) => {
        try {
            const { moduleId } = req.params;
            const lessons = await Lesson.find({ moduleId });

            return responseHelper.success(res, lessons);
        } catch (error) {
            console.error('Get lessons error:', error);
            return responseHelper.error(res, error.message);
        }
    },

    getLessonById: async (req, res) => {
        try {
            const { moduleId, lessonId } = req.params;
            console.log('Getting lesson:', { moduleId, lessonId });

            const lesson = await Lesson.findOne({
                _id: lessonId,
                moduleId: moduleId
            });

            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    message: 'Lesson not found'
                });
            }

            // Log practice exercises and their images
            if (lesson.practiceExercises) {
                console.log('Practice exercises found:', lesson.practiceExercises.length);
                lesson.practiceExercises.forEach((exercise, index) => {
                    console.log(`Exercise ${index + 1}:`, {
                        hasData: !!exercise.data,
                        imageUrl: exercise.data?.image
                    });
                });
            }

            return res.json({
                success: true,
                data: lesson
            });
        } catch (error) {
            console.error('Get lesson by id error:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    createLesson: async (req, res) => {
        try {
            const { moduleId } = req.params;
            let lessonData = { ...req.body, moduleId };

            // Ensure contentSections are properly structured
            if (lessonData.contentSections) {
                lessonData.contentSections = lessonData.contentSections.map(section => ({
                    title: section.title || '',
                    paragraphs: Array.isArray(section.paragraphs) ? section.paragraphs.map(p => ({
                        type: p.type || 'text',
                        content: p.content || '',
                        imageUrl: p.imageUrl || '',
                        imagePublicId: p.imagePublicId || ''
                    })) : []
                }));
            }

            // Add default content section if none provided
            if (!lessonData.contentSections || lessonData.contentSections.length === 0) {
                lessonData.contentSections = [{
                    title: '',
                    paragraphs: [{
                        type: 'text',
                        content: '',
                        imageUrl: '',
                        imagePublicId: ''
                    }]
                }];
            }

            const lesson = await Lesson.create({
                ...lessonData,
                createdBy: req.user.userId
            });
            await Module.findByIdAndUpdate(
                moduleId,
                { $push: { lessons: lesson._id } },
                { new: true }
              );
            return responseHelper.success(res, lesson, 'Lesson created successfully', 201);
        } catch (error) {
            console.warn('Create lesson error:', error);
            return responseHelper.error(res, error.message);
        }
    },



    updateLesson: async (req, res) => {
        try {
            const { moduleId, lessonId } = req.params;
            const updateData = { ...req.body };

            // Transform content sections while preserving other data
            if (updateData.contentSections) {
                updateData.contentSections = updateData.contentSections.map(section => ({
                    title: section.title || '',
                    paragraphs: Array.isArray(section.paragraphs) ? section.paragraphs.map(p => ({
                        type: p.type || 'text',
                        content: p.content || '',
                        imageUrl: p.imageUrl || '',
                        imagePublicId: p.imagePublicId || ''
                    })) : []
                }));
            }

            // Find existing lesson
            const existingLesson = await Lesson.findById(lessonId);
            if (!existingLesson) {
                return responseHelper.error(res, 'Lesson not found', 404);
            }

            // Handle image cleanup for removed/changed practice exercises
            if (existingLesson.practiceExercises) {
                existingLesson.practiceExercises.forEach(async (oldExercise) => {
                    if (oldExercise.data?.publicId) {
                        const newExercise = updateData.practiceExercises?.find(
                            e => e._id && e._id.toString() === oldExercise._id.toString()
                        );

                        if (!newExercise || newExercise.data?.publicId !== oldExercise.data.publicId) {
                            try {
                                await cloudinary.uploader.destroy(oldExercise.data.publicId);
                                await MediaContent.findOneAndDelete({ publicId: oldExercise.data.publicId });
                            } catch (err) {
                                console.error('Error cleaning up old image:', err);
                            }
                        }
                    }
                });
            }

            // Update lesson
            const lesson = await Lesson.findOneAndUpdate(
                { _id: lessonId, moduleId },
                {
                    ...updateData,
                    updatedBy: req.user.userId
                },
                { new: true }
            );

            return responseHelper.success(res, lesson);
        } catch (error) {
            console.error('Update lesson error:', error);
            return responseHelper.error(res, error.message);
        }
    },

    deleteLesson: async (req, res) => {
        try {
            const { moduleId, lessonId } = req.params;

            // Get lesson to clean up images
            const lesson = await Lesson.findOne({ _id: lessonId, moduleId });

            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    message: 'Lesson not found'
                });
            }

            // Clean up images from Cloudinary
            for (const exercise of lesson.practiceExercises) {
                if (exercise.data?.publicId) {
                    try {
                        await cloudinary.uploader.destroy(exercise.data.publicId);
                        await MediaContent.findOneAndDelete({ publicId: exercise.data.publicId });
                    } catch (err) {
                        console.error('Error cleaning up image:', err);
                    }
                }
            }

            // Delete lesson
            await lesson.remove();

            return res.json({
                success: true,
                message: 'Lesson deleted successfully'
            });
        } catch (error) {
            console.error('Delete lesson error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete lesson'
            });
        }
    }
};

module.exports = contentController;