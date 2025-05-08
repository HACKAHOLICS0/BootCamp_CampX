const mongoose = require('mongoose');
const Event = mongoose.model('Event');
const UserEventPreference = require('../Model/UserEventPreference');
const User = mongoose.model('User');

/**
 * Service de recommandation d'événements
 * Utilise les préférences utilisateur et l'historique pour recommander des événements pertinents
 */
class RecommendationService {
    /**
     * Obtient des recommandations d'événements pour un utilisateur spécifique
     * @param {string} userId - ID de l'utilisateur
     * @param {number} limit - Nombre maximum de recommandations à retourner
     * @returns {Promise<Array>} - Liste des événements recommandés
     */
    async getRecommendationsForUser(userId, limit = 5) {
        try {
            // Vérifier si l'utilisateur existe
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }

            // Récupérer les préférences de l'utilisateur
            let userPreferences = await UserEventPreference.findOne({ user: userId })
                .populate('eventHistory.event');

            // Si l'utilisateur n'a pas de préférences, créer des préférences par défaut
            if (!userPreferences) {
                userPreferences = {
                    categoryPreferences: [],
                    locationPreferences: [],
                    timePreferences: {
                        preferredDays: [],
                        preferredTimeOfDay: []
                    },
                    eventHistory: []
                };
            }

            // Récupérer tous les événements à venir et approuvés
            const upcomingEvents = await Event.find({
                date: { $gt: new Date() },
                isApproved: true,
                // Exclure les événements auxquels l'utilisateur est déjà inscrit
                attendees: { $ne: userId }
            }).populate('organizer', 'name email');

            if (upcomingEvents.length === 0) {
                return [];
            }

            // Calculer un score pour chaque événement
            const scoredEvents = upcomingEvents.map(event => {
                let score = 0;

                // 1. Score basé sur la catégorie
                const categoryPreference = userPreferences.categoryPreferences.find(
                    pref => pref.category === event.category
                );

                if (categoryPreference) {
                    score += categoryPreference.weight * 2; // Poids plus important pour la catégorie
                }

                // 2. Score basé sur le lieu
                const locationPreference = userPreferences.locationPreferences.find(
                    pref => pref.location === event.location
                );

                if (locationPreference) {
                    score += locationPreference.weight;
                }

                // 3. Score basé sur le jour de la semaine
                const eventDate = new Date(event.date);
                const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][eventDate.getDay()];

                if (userPreferences.timePreferences.preferredDays.includes(dayOfWeek)) {
                    score += 1;
                }

                // 4. Score basé sur le moment de la journée
                const hour = eventDate.getHours();
                let timeOfDay;

                if (hour < 12) {
                    timeOfDay = 'morning';
                } else if (hour < 18) {
                    timeOfDay = 'afternoon';
                } else {
                    timeOfDay = 'evening';
                }

                if (userPreferences.timePreferences.preferredTimeOfDay.includes(timeOfDay)) {
                    score += 1;
                }

                // 5. Score basé sur l'historique des événements
                // Analyser les événements auxquels l'utilisateur a assisté
                const attendedEvents = userPreferences.eventHistory.filter(
                    history => history.interactionType === 'attended'
                );

                // Vérifier si l'utilisateur a assisté à des événements de la même catégorie
                const attendedSameCategory = attendedEvents.some(
                    history => history.event && history.event.category === event.category
                );

                if (attendedSameCategory) {
                    score += 2;
                }

                // Vérifier si l'utilisateur a assisté à des événements du même organisateur
                const attendedSameOrganizer = attendedEvents.some(
                    history => history.event &&
                    history.event.organizer &&
                    event.organizer &&
                    history.event.organizer.toString() === event.organizer._id.toString()
                );

                if (attendedSameOrganizer) {
                    score += 1.5;
                }

                // 6. Bonus pour les événements populaires (beaucoup de participants)
                const popularityRatio = event.attendees.length / event.maxAttendees;
                if (popularityRatio > 0.5) {
                    score += popularityRatio;
                }

                // 7. Bonus pour les événements qui ont lieu bientôt
                const daysUntilEvent = Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24));
                if (daysUntilEvent < 7) {
                    score += (7 - daysUntilEvent) / 7;
                }

                return {
                    event,
                    score
                };
            });

            // Trier les événements par score décroissant
            scoredEvents.sort((a, b) => b.score - a.score);

            // Retourner les événements avec les scores les plus élevés
            return scoredEvents.slice(0, limit).map(item => ({
                ...item.event.toObject(),
                recommendationScore: item.score
            }));
        } catch (error) {
            console.error('Erreur lors de la génération des recommandations :', error);
            throw error;
        }
    }

    /**
     * Obtient des recommandations d'événements similaires à un événement spécifique
     * @param {string} eventId - ID de l'événement
     * @param {number} limit - Nombre maximum de recommandations à retourner
     * @returns {Promise<Array>} - Liste des événements similaires recommandés
     */
    async getSimilarEvents(eventId, limit = 3) {
        try {
            // Récupérer l'événement de référence
            const referenceEvent = await Event.findById(eventId);
            if (!referenceEvent) {
                throw new Error('Événement non trouvé');
            }

            // Récupérer tous les événements à venir et approuvés, sauf l'événement de référence
            const upcomingEvents = await Event.find({
                _id: { $ne: eventId },
                date: { $gt: new Date() },
                isApproved: true
            }).populate('organizer', 'name email');

            if (upcomingEvents.length === 0) {
                return [];
            }

            // Calculer un score de similarité pour chaque événement
            const scoredEvents = upcomingEvents.map(event => {
                let similarityScore = 0;

                // 1. Même catégorie
                if (event.category === referenceEvent.category) {
                    similarityScore += 3;
                }

                // 2. Même lieu
                if (event.location === referenceEvent.location) {
                    similarityScore += 2;
                }

                // 3. Même organisateur
                if (event.organizer && referenceEvent.organizer &&
                    event.organizer.toString() === referenceEvent.organizer.toString()) {
                    similarityScore += 2.5;
                }

                // 4. Proximité de date
                const daysDifference = Math.abs(
                    Math.ceil((event.date - referenceEvent.date) / (1000 * 60 * 60 * 24))
                );

                if (daysDifference < 14) {
                    similarityScore += (14 - daysDifference) / 14;
                }

                return {
                    event,
                    similarityScore
                };
            });

            // Trier les événements par score de similarité décroissant
            scoredEvents.sort((a, b) => b.similarityScore - a.similarityScore);

            // Retourner les événements les plus similaires
            return scoredEvents.slice(0, limit).map(item => ({
                ...item.event.toObject(),
                similarityScore: item.similarityScore
            }));
        } catch (error) {
            console.error('Erreur lors de la recherche d\'événements similaires :', error);
            throw error;
        }
    }

    /**
     * Met à jour les préférences utilisateur en fonction de ses interactions
     * @param {string} userId - ID de l'utilisateur
     * @param {string} eventId - ID de l'événement
     * @param {string} interactionType - Type d'interaction (viewed, registered, attended, cancelled)
     * @param {Object} feedback - Feedback optionnel (rating, comment)
     * @returns {Promise<Object>} - Préférences utilisateur mises à jour
     */
    async updateUserPreferences(userId, eventId, interactionType, feedback = {}) {
        try {
            // Récupérer l'événement
            const event = await Event.findById(eventId);
            if (!event) {
                throw new Error('Événement non trouvé');
            }

            // Récupérer ou créer les préférences utilisateur
            let userPreferences = await UserEventPreference.findOne({ user: userId });

            if (!userPreferences) {
                userPreferences = new UserEventPreference({
                    user: userId,
                    categoryPreferences: [],
                    locationPreferences: [],
                    timePreferences: {
                        preferredDays: [],
                        preferredTimeOfDay: []
                    },
                    eventHistory: []
                });
            }

            // Ajouter l'interaction à l'historique
            const historyEntry = {
                event: eventId,
                interactionType,
                interactionDate: new Date()
            };

            // Ajouter le feedback si disponible
            if (feedback.rating) {
                historyEntry.rating = feedback.rating;
            }

            if (feedback.comment) {
                historyEntry.feedback = feedback.comment;
            }

            userPreferences.eventHistory.push(historyEntry);

            // Mettre à jour les préférences de catégorie
            let categoryPreference = userPreferences.categoryPreferences.find(
                pref => pref.category === event.category
            );

            if (categoryPreference) {
                // Ajuster le poids en fonction du type d'interaction
                switch (interactionType) {
                    case 'viewed':
                        categoryPreference.weight += 0.1;
                        break;
                    case 'registered':
                        categoryPreference.weight += 0.5;
                        break;
                    case 'attended':
                        categoryPreference.weight += 1.0;
                        break;
                    case 'cancelled':
                        categoryPreference.weight -= 0.3;
                        break;
                }

                // S'assurer que le poids reste dans les limites
                categoryPreference.weight = Math.max(0, Math.min(5, categoryPreference.weight));
            } else {
                // Créer une nouvelle préférence de catégorie
                let initialWeight = 1.0;

                switch (interactionType) {
                    case 'viewed':
                        initialWeight = 1.1;
                        break;
                    case 'registered':
                        initialWeight = 1.5;
                        break;
                    case 'attended':
                        initialWeight = 2.0;
                        break;
                    case 'cancelled':
                        initialWeight = 0.7;
                        break;
                }

                userPreferences.categoryPreferences.push({
                    category: event.category,
                    weight: initialWeight
                });
            }

            // Mettre à jour les préférences de lieu
            let locationPreference = userPreferences.locationPreferences.find(
                pref => pref.location === event.location
            );

            if (locationPreference) {
                // Ajuster le poids en fonction du type d'interaction
                switch (interactionType) {
                    case 'viewed':
                        locationPreference.weight += 0.1;
                        break;
                    case 'registered':
                        locationPreference.weight += 0.3;
                        break;
                    case 'attended':
                        locationPreference.weight += 0.7;
                        break;
                    case 'cancelled':
                        locationPreference.weight -= 0.2;
                        break;
                }

                // S'assurer que le poids reste dans les limites
                locationPreference.weight = Math.max(0, Math.min(5, locationPreference.weight));
            } else {
                // Créer une nouvelle préférence de lieu
                let initialWeight = 1.0;

                switch (interactionType) {
                    case 'viewed':
                        initialWeight = 1.1;
                        break;
                    case 'registered':
                        initialWeight = 1.3;
                        break;
                    case 'attended':
                        initialWeight = 1.7;
                        break;
                    case 'cancelled':
                        initialWeight = 0.8;
                        break;
                }

                userPreferences.locationPreferences.push({
                    location: event.location,
                    weight: initialWeight
                });
            }

            // Mettre à jour les préférences de temps
            const eventDate = new Date(event.date);
            const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][eventDate.getDay()];

            if (interactionType === 'registered' || interactionType === 'attended') {
                // Ajouter le jour de la semaine aux préférences si ce n'est pas déjà fait
                if (!userPreferences.timePreferences.preferredDays.includes(dayOfWeek)) {
                    userPreferences.timePreferences.preferredDays.push(dayOfWeek);
                }

                // Déterminer le moment de la journée
                const hour = eventDate.getHours();
                let timeOfDay;

                if (hour < 12) {
                    timeOfDay = 'morning';
                } else if (hour < 18) {
                    timeOfDay = 'afternoon';
                } else {
                    timeOfDay = 'evening';
                }

                // Ajouter le moment de la journée aux préférences si ce n'est pas déjà fait
                if (!userPreferences.timePreferences.preferredTimeOfDay.includes(timeOfDay)) {
                    userPreferences.timePreferences.preferredTimeOfDay.push(timeOfDay);
                }
            }

            // Mettre à jour la date de dernière mise à jour
            userPreferences.lastUpdated = new Date();

            // Sauvegarder les préférences mises à jour
            await userPreferences.save();

            return userPreferences;
        } catch (error) {
            console.error('Erreur lors de la mise à jour des préférences utilisateur :', error);
            throw error;
        }
    }
}

module.exports = new RecommendationService();
