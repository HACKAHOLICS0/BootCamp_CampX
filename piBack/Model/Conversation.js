const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const conversationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        default: 'Nouvelle conversation'
    },
    messages: [messageSchema],
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Middleware pour mettre à jour lastActivity
conversationSchema.pre('save', function(next) {
    this.lastActivity = new Date();
    next();
});

// Méthode pour ajouter un message
conversationSchema.methods.addMessage = function(role, content) {
    this.messages.push({ role, content });
    this.lastActivity = new Date();
    return this.save();
};

// Méthode pour obtenir l'historique des messages
conversationSchema.methods.getHistory = function(limit = 10) {
    return this.messages.slice(-limit);
};

// Méthode pour obtenir le contexte de la conversation
conversationSchema.methods.getContext = function(limit = 5) {
    return this.messages
        .slice(-limit)
        .map(msg => ({
            role: msg.role,
            content: msg.content
        }));
};

// Index pour améliorer les performances des requêtes
conversationSchema.index({ userId: 1, lastActivity: -1 });
conversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
