const mongoose = require('mongoose');

const ResponseSchema = new mongoose.Schema({
    texte: {
        type: String,
        required: true
    },
    isCorrect: {
        type: Boolean,
        required: true,
        select: false // Hide correct answers from frontend by default
    }
});

const QuestionSchema = new mongoose.Schema({
    texte: {
        type: String,
        required: true
    },
    Responses: [ResponseSchema],
    points: {
        type: Number,
        default: 1
    },
    activer: {
        type: Boolean,
        default: true
    }
});

const QuizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: 'No description available'
    },
    chrono: {
        type: Boolean,
        default: false
    },
    chronoVal: {
        type: Number,
        default: 30 // Default 30 minutes
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    Questions: [QuestionSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
QuizSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Add index for better query performance
QuizSchema.index({ course: 1 });

// Add virtual for total points
QuizSchema.virtual('totalPoints').get(function() {
    return this.Questions.reduce((total, question) => {
        return question.activer ? total + question.points : total;
    }, 0);
});

// Add virtual for active question count
QuizSchema.virtual('activeQuestionCount').get(function() {
    return this.Questions.filter(q => q.activer).length;
});

module.exports = mongoose.model('Quiz', QuizSchema);