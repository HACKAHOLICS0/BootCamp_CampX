const express = require('express');
const router = express.Router();
const videoQuizController = require('../controllers/videoQuizController');
const auth = require('../middleware/auth');

// Routes publiques (accessibles à tous)
router.get('/video/:videoId', videoQuizController.getVideoQuizzes);

// Routes qui nécessitent authentification normale
router.post('/response', auth, videoQuizController.saveQuizResponse);
router.get('/user/progress/:userId', auth, videoQuizController.getUserVideoProgress);

// Routes qui nécessitent des privilèges d'administrateur
router.post('/', auth, videoQuizController.createVideoQuiz);
router.get('/statistics', auth, videoQuizController.getQuizStatistics);
router.get('/user/responses/:userId', auth, videoQuizController.getUserQuizResponses);

module.exports = router;
