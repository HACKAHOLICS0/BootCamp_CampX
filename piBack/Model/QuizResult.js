const mongoose = require('mongoose');

const QuizResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  totalPoints: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  answers: {
    type: Map,
    of: String,
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  // Nouveaux champs pour la détection de fraude
  timeSpent: {
    type: Number, // en secondes
    required: true
  },
  answerTimes: {
    type: Map,
    of: Number, // temps de réponse en secondes pour chaque question
    required: true
  },
  fraudDetection: {
    isSuspicious: {
      type: Boolean,
      default: false
    },
    reasons: [{
      type: String,
      enum: ['TOO_FAST', 'INCONSISTENT_TIME', 'UNREALISTIC_SCORE', 'VIDEO_FRAUD']
    }]
  }
}, {
  timestamps: true
});

// Add index for faster queries
QuizResultSchema.index({ user: 1, quiz: 1 });

module.exports = mongoose.model('QuizResult', QuizResultSchema);