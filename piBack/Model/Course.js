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
    quizzes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz'
    }],
    finalQuiz: {
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
        duration: Number,
        description: String
    }]
});

module.exports = mongoose.model('Course', courseSchema);
