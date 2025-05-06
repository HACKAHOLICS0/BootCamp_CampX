
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            'javascript',
            'typescript',
            'python',
            'java',
            'csharp',
            'sql',
            'mongodb',
            'html',
            'css',
            'php',
            'ruby',
            'go',
            'rust',
            'swift',
            'kotlin',
            'scala',
            'r',
            'shell',
            'powershell',
            'bash',
            'docker',
            'yaml',
            'json',
            'xml',
            'markdown',
            'other'
        ]
    },
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz'
    },
    price: {
        type: Number,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    codeExamples: [{
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        code: {
            type: String,
            required: true
        },
        language: {
            type: String,
            required: true
        },
        isExercise: {
            type: Boolean,
            default: false
        },
        solution: {
            type: String,
            default: ''
        },
        hints: [{
            type: String
        }]
    }],
    duration: {
        type: Number, // in hours
        required: true
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    purchasedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    videos: [{
        title: String,
        url: String,
        description: String
    }],
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    tags: [{
        type: String
    }],
    thumbnail: {
        type: String
    }
});

module.exports = mongoose.model('Course', courseSchema);
