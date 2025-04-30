const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  interactivePoints: [{
    timestamp: {
      type: Number, // Temps en secondes où la question apparaît
      required: true
    },
    question: {
      type: String,
      required: true
    },
    options: [{
      text: String,
      isCorrect: Boolean
    }],
    explanation: String // Explication de la réponse correcte
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model("Video", videoSchema);
