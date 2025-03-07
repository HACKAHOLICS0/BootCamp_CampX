const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    chrono: {
        type: Boolean,
        default: false
    },
    chronoVal: {
        type: Number,
        default: 0
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    questions: [{
        question: {
            type: String,
            required: true
        },
        options: [{
            text: {
                type: String,
                required: true
            },
            isCorrect: {
                type: Boolean,
                required: true
            }
        }],
        points: {
            type: Number,
            default: 1
        },
        activer: {
            type: Boolean,
            default: true
        }
    }],
    dateQuiz: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Quiz', QuizSchema);