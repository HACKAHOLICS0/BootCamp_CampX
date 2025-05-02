const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Modèle pour stocker les préférences des utilisateurs concernant les événements
 * et leur historique d'interactions avec les événements.
 * Ce modèle sera utilisé par le moteur de recommandation.
 */
const userEventPreferenceSchema = new Schema({
    // Référence à l'utilisateur
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Catégories préférées par l'utilisateur (avec poids)
    categoryPreferences: [{
        category: {
            type: String,
            required: true
        },
        weight: {
            type: Number,
            default: 1.0, // Poids par défaut
            min: 0,
            max: 5
        }
    }],
    
    // Historique des événements auxquels l'utilisateur a participé
    eventHistory: [{
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: true
        },
        // Type d'interaction avec l'événement
        interactionType: {
            type: String,
            enum: ['viewed', 'registered', 'attended', 'cancelled'],
            required: true
        },
        // Date de l'interaction
        interactionDate: {
            type: Date,
            default: Date.now
        },
        // Feedback de l'utilisateur (optionnel)
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        // Commentaire de l'utilisateur (optionnel)
        feedback: {
            type: String
        }
    }],
    
    // Préférences de localisation
    locationPreferences: [{
        location: {
            type: String,
            required: true
        },
        weight: {
            type: Number,
            default: 1.0,
            min: 0,
            max: 5
        }
    }],
    
    // Préférences d'horaire
    timePreferences: {
        preferredDays: [{
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        }],
        preferredTimeOfDay: [{
            type: String,
            enum: ['morning', 'afternoon', 'evening']
        }]
    },
    
    // Dernière mise à jour des préférences
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Index pour améliorer les performances des requêtes
userEventPreferenceSchema.index({ user: 1 });
userEventPreferenceSchema.index({ 'eventHistory.event': 1 });
userEventPreferenceSchema.index({ 'categoryPreferences.category': 1 });

module.exports = mongoose.model('UserEventPreference', userEventPreferenceSchema);