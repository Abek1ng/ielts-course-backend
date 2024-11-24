// models/Module.js
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

const Module = mongoose.model('Module', moduleSchema);
// models/Content.js

const paragraphSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['text', 'image'],
        default: 'text'
    },
    content: String,
    imageUrl: String,
    imagePublicId: String
});
// Lesson Schema
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
        paragraphs: [paragraphSchema]  // Using the paragraphSchema instead of [String]
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
    practiceExercises: [{
        exerciseType: {
            type: String,
            enum: ['writing', 'analysis']
        },
        instructions: String,
        questions: [String],
        imageUrl: {
            type: String,
            trim: true
        }
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

const Lesson = mongoose.model('Lesson', lessonSchema);

module.exports = { Lesson };



// models/MediaContent.js
const mediaContentSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    url: {
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

const MediaContent = mongoose.model('MediaContent', mediaContentSchema);

module.exports = {
    Module,
    Lesson,
    MediaContent
};