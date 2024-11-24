// models/Content.js
const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    order: {
        type: Number,
        default: 0
    },
    published: {
        type: Boolean,
        default: false
    },
    lessons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const practiceExerciseSchema = new mongoose.Schema({
    exerciseType: {
        type: String,
        enum: ['writing', 'analysis'],
        required: true
    },
    instructions: {
        type: String,
        required: true
    },
    questions: [String],
    data: {
        imageUrl: String,
        publicId: String
    }
});
const paragraphSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['text', 'image'],
        required: true,
        default: 'text'
    },
    content: {
        type: String,
        default: ''
    },
    imageUrl: {
        type: String,
        default: ''
    },
    imagePublicId: {
        type: String,
        default: ''
    }
}, { _id: false });
const lessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        required: true
    },
    contentSections: [{
        title: String,
        paragraphs: [paragraphSchema]  // Updated to use paragraphSchema
    }],
    vocabularyExercises: [{
        exerciseType: {
            type: String,
            enum: ['matching', 'multipleChoice', 'fillInTheBlank']
        },
        instructions: String,
        questions: [{
            type: Object
        }]
    }],
    practiceExercises: [practiceExerciseSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const mediaContentSchema = new mongoose.Schema({
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: {
        type: String,
        required: true
    },
    publicId: {
        type: String,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

const Module = mongoose.model('Module', moduleSchema);
const Lesson = mongoose.model('Lesson', lessonSchema);
const MediaContent = mongoose.model('MediaContent', mediaContentSchema);

module.exports = {
    Module,
    Lesson,
    MediaContent
};