const recommendationService = require('../services/recommendationService');
const UserEventPreference = require('../Model/UserEventPreference');

/**
 * Contrôleur pour les fonctionnalités de recommandation d'événements
 */

// Obtenir des recommandations d'événements pour l'utilisateur connecté
exports.getRecommendationsForUser = async (req, res) => {
    try {
        const userId = req.user._id;
        const limit = req.query.limit ? parseInt(req.query.limit) : 5;
        
        const recommendations = await recommendationService.getRecommendationsForUser(userId, limit);
        
        res.json({
            success: true,
            count: recommendations.length,
            recommendations
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des recommandations :', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des recommandations',
            error: error.message
        });
    }
};

// Obtenir des événements similaires à un événement spécifique
exports.getSimilarEvents = async (req, res) => {
    try {
        const { eventId } = req.params;
        const limit = req.query.limit ? parseInt(req.query.limit) : 3;
        
        const similarEvents = await recommendationService.getSimilarEvents(eventId, limit);
        
        res.json({
            success: true,
            count: similarEvents.length,
            similarEvents
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des événements similaires :', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des événements similaires',
            error: error.message
        });
    }
};

// Enregistrer une interaction utilisateur avec un événement
exports.recordUserInteraction = async (req, res) => {
    try {
        const userId = req.user._id;
        const { eventId } = req.params;
        const { interactionType, rating, feedback } = req.body;
        
        // Valider le type d'interaction
        const validInteractionTypes = ['viewed', 'registered', 'attended', 'cancelled'];
        if (!validInteractionTypes.includes(interactionType)) {
            return res.status(400).json({
                success: false,
                message: 'Type d\'interaction invalide'
            });
        }
        
        // Préparer l'objet feedback
        const feedbackData = {};
        if (rating) {
            feedbackData.rating = parseInt(rating);
            
            // Valider la note
            if (feedbackData.rating < 1 || feedbackData.rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'La note doit être comprise entre 1 et 5'
                });
            }
        }
        
        if (feedback) {
            feedbackData.comment = feedback;
        }
        
        // Mettre à jour les préférences utilisateur
        const updatedPreferences = await recommendationService.updateUserPreferences(
            userId,
            eventId,
            interactionType,
            feedbackData
        );
        
        res.json({
            success: true,
            message: 'Interaction enregistrée avec succès',
            preferences: updatedPreferences
        });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'interaction :', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'enregistrement de l\'interaction',
            error: error.message
        });
    }
};

// Obtenir les préférences utilisateur
exports.getUserPreferences = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const userPreferences = await UserEventPreference.findOne({ user: userId })
            .populate('eventHistory.event');
        
        if (!userPreferences) {
            return res.status(404).json({
                success: false,
                message: 'Aucune préférence trouvée pour cet utilisateur'
            });
        }
        
        res.json({
            success: true,
            preferences: userPreferences
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des préférences utilisateur :', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des préférences utilisateur',
            error: error.message
        });
    }
};

// Réinitialiser les préférences utilisateur
exports.resetUserPreferences = async (req, res) => {
    try {
        const userId = req.user._id;
        
        await UserEventPreference.findOneAndDelete({ user: userId });
        
        res.json({
            success: true,
            message: 'Préférences utilisateur réinitialisées avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la réinitialisation des préférences utilisateur :', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la réinitialisation des préférences utilisateur',
            error: error.message
        });
    }
};
