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
    }],
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }], // NEW: Multiple categories
    enrolledStudentsCount: { type: Number, default: 0 }, // NEW: Track course popularity
    completionCount: { type: Number, default: 0 }, // NEW: Measure effectiveness
    averageRating: { type: Number, default: 0 }, // NEW: Rank courses
    totalRevenue: { type: Number, default: 0 } // NEW: Earnings per course
});

module.exports = mongoose.model('Course', courseSchema);
