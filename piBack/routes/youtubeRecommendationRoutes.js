const express = require('express');
const router = express.Router();
const youtubeRecommendationController = require('../controllers/youtubeRecommendationController');
const userAuth = require('../middleware/userAuth');

// Route protégée pour obtenir des recommandations YouTube basées sur les points d'intérêt de l'utilisateur
router.get('/recommendations', userAuth, youtubeRecommendationController.getYoutubeRecommendations);

// Route pour obtenir des vidéos YouTube par catégorie
router.get('/category/:category', userAuth, youtubeRecommendationController.getYoutubeVideosByCategory);

module.exports = router;
