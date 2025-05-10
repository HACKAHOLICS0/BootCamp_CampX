const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    image: {
        type: String
    },
    duration: {
        type: Number, // in hours
        default: 0
    },
    coursesCount: {
        type: Number,
        default: 0
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'intermediate'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    statistics: {
        totalStudents: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        completionRate: { type: Number, default: 0 }
    }
});

module.exports = mongoose.model('Module', moduleSchema);
