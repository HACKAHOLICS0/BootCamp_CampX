const express = require('express');
const router = express.Router();
const multer = require('multer');
const transcriptionController = require('../controllers/transcriptionController');

// Configuration de multer pour stocker les fichiers en mémoire
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limite à 10 Mo
  }
});

// Route pour transcrire l'audio
router.post('/transcribe', upload.single('audio'), transcriptionController.transcribeAudio);

module.exports = router;
