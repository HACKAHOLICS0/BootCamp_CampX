const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const userAuth = require('../middleware/userAuth');

// Routes protégées (nécessitent une authentification)
router.use(userAuth);

// Obtenir des recommandations d'événements pour l'utilisateur connecté
router.get('/events', recommendationController.getRecommendationsForUser);

// Obtenir des événements similaires à un événement spécifique
router.get('/events/similar/:eventId', recommendationController.getSimilarEvents);

// Enregistrer une interaction utilisateur avec un événement
router.post('/interaction/:eventId', recommendationController.recordUserInteraction);

// Obtenir les préférences utilisateur
router.get('/preferences', recommendationController.getUserPreferences);

// Réinitialiser les préférences utilisateur
router.delete('/preferences', recommendationController.resetUserPreferences);

module.exports = router;
