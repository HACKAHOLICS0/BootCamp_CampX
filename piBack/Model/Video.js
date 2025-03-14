const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  videoUrl: { type: String, required: true }, // Lien de la vidéo stockée
  quiz: [
    {
      timestamp: { type: Number, required: true }, // Moment où la vidéo doit s'arrêter (en secondes)
      question: { type: String, required: true }, // Question à poser
      options: [{ type: String }], // Options de réponse
      answer: { type: String, required: true }, // Réponse correcte
    },
  ],
});

module.exports = mongoose.model("Video", VideoSchema);
