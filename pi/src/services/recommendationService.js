import axiosInstance from './axiosConfig';

/**
 * Service pour interagir avec l'API de recommandation d'événements
 */
class RecommendationService {
    /**
     * Obtient des recommandations d'événements pour l'utilisateur connecté
     * @param {number} limit - Nombre maximum de recommandations à retourner
     * @returns {Promise<Array>} - Liste des événements recommandés
     */
    async getRecommendations(limit = 5) {
        try {
            const response = await axiosInstance.get(`/recommendations/events?limit=${limit}`);
            return response.data.recommendations;
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            throw new Error('Failed to fetch recommendations');
        }
    }

    /**
     * Obtient des événements similaires à un événement spécifique
     * @param {string} eventId - ID de l'événement
     * @param {number} limit - Nombre maximum d'événements similaires à retourner
     * @returns {Promise<Array>} - Liste des événements similaires
     */
    async getSimilarEvents(eventId, limit = 3) {
        try {
            const response = await axiosInstance.get(`/recommendations/events/similar/${eventId}?limit=${limit}`);
            return response.data.similarEvents;
        } catch (error) {
            console.error('Error fetching similar events:', error);
            throw new Error('Failed to fetch similar events');
        }
    }

    /**
     * Enregistre une interaction utilisateur avec un événement
     * @param {string} eventId - ID de l'événement
     * @param {string} interactionType - Type d'interaction (viewed, registered, attended, cancelled)
     * @param {Object} feedback - Feedback optionnel (rating, comment)
     * @returns {Promise<Object>} - Résultat de l'opération
     */
    async recordInteraction(eventId, interactionType, feedback = {}) {
        try {
            const response = await axiosInstance.post(`/recommendations/interaction/${eventId}`, {
                interactionType,
                rating: feedback.rating,
                feedback: feedback.comment
            });
            return response.data;
        } catch (error) {
            console.error('Error recording interaction:', error);
            throw new Error('Failed to record interaction');
        }
    }

    /**
     * Obtient les préférences utilisateur
     * @returns {Promise<Object>} - Préférences utilisateur
     */
    async getUserPreferences() {
        try {
            const response = await axiosInstance.get('/recommendations/preferences');
            return response.data.preferences;
        } catch (error) {
            console.error('Error fetching user preferences:', error);
            throw new Error('Failed to fetch user preferences');
        }
    }

    /**
     * Réinitialise les préférences utilisateur
     * @returns {Promise<Object>} - Résultat de l'opération
     */
    async resetUserPreferences() {
        try {
            const response = await axiosInstance.delete('/recommendations/preferences');
            return response.data;
        } catch (error) {
            console.error('Error resetting user preferences:', error);
            throw new Error('Failed to reset user preferences');
        }
    }

    /**
     * Fonction de compatibilité avec l'ancien code
     * Calcule un score pour un événement en fonction des préférences utilisateur
     */
    calculateEventScore(event, userPreferences, userHistory) {
        let score = 0;

        // Category match
        if (userPreferences.categories && userPreferences.categories.includes(event.category)) {
            score += 3;
        }

        // Location preference
        if (userPreferences.preferredLocations && userPreferences.preferredLocations.includes(event.location)) {
            score += 2;
        }

        // Date preference (favor upcoming events)
        const eventDate = new Date(event.date);
        const now = new Date();
        const daysUntilEvent = (eventDate - now) / (1000 * 60 * 60 * 24);
        if (daysUntilEvent > 0 && daysUntilEvent < 30) {
            score += 2;
        }

        // Attendance availability
        const availableSpots = event.maxAttendees - event.attendees.length;
        if (availableSpots > 0) {
            score += 1;
        }

        // Similar to past attended events
        if (userHistory && userHistory.length > 0) {
            const hasAttendedSimilar = userHistory.some(
                pastEvent => pastEvent.category === event.category
            );
            if (hasAttendedSimilar) {
                score += 2;
            }
        }

        return score;
    }

    /**
     * Fonction de compatibilité avec l'ancien code
     * Recommande des événements en fonction des préférences utilisateur
     */
    recommendEvents(events, userPreferences, userHistory) {
        const scoredEvents = events.map(event => ({
            ...event,
            score: this.calculateEventScore(event, userPreferences, userHistory)
        }));

        return scoredEvents.sort((a, b) => b.score - a.score);
    }
}

export default new RecommendationService();
