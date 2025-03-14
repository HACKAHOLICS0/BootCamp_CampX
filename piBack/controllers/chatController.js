const Conversation = require('../Model/Conversation');
const User = require('../Model/User');
const { getPrediction } = require('../utils/pythonAiService');
const axios = require('axios');

const PYTHON_SERVICE_URL = 'http://127.0.0.1:5001/predict';

exports.createConversation = async (req, res) => {
    try {
        const { userId, message } = req.body;

        // Vérifier si l'utilisateur existe
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Envoyer le message au modèle IA pour obtenir une réponse
        const aiResponse = await axios.post(PYTHON_SERVICE_URL, {
            message: message,
            context: { userId: userId }
        });

        // Vérifier si une conversation existe déjà pour cet utilisateur
        let conversation = await Conversation.findOne({ userId });

        if (!conversation) {
            // Si aucune conversation n'existe, en créer une nouvelle
            conversation = new Conversation({
                userId,
                title: 'Nouvelle conversation',
                messages: []
            });
        }

        // Ajouter les messages (utilisateur + assistant) à la conversation existante
        conversation.messages.push(
            { role: 'user', content: message },
            { role: 'assistant', content: aiResponse.data.response }
        );

        // Sauvegarder la conversation mise à jour
        await conversation.save();

        res.status(200).json({
            success: true,
            data: conversation
        });

    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour de la conversation:', error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la mise à jour de la conversation",
            error: error.message
        });
    }
};

// Obtenir la conversation d'un utilisateur (une seule conversation désormais)
exports.getUserConversations = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const conversation = await Conversation.findOne({ userId });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Aucune conversation trouvée pour cet utilisateur."
            });
        }

        res.status(200).json({
            success: true,
            data: conversation
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération de la conversation:', error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération de la conversation",
            error: error.message
        });
    }
};

// Obtenir une conversation spécifique avec ses messages
exports.getConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        
        const conversation = await Conversation.findById(conversationId);
        
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation non trouvée"
            });
        }
        
        res.status(200).json({
            success: true,
            data: conversation
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de la conversation:', error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération de la conversation",
            error: error.message
        });
    }
};

// Envoyer un message et obtenir une réponse
exports.sendMessage = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { message } = req.body;
        
        // Récupérer la conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation non trouvée"
            });
        }
        
        // Récupérer les informations de l'utilisateur pour le contexte
        const user = await User.findById(conversation.userId);
        const userCourses = await Course.find({
            purchasedBy: { $in: [conversation.userId] }
        }).select('title');
        
        const userInfo = {
            name: user ? user.name : undefined,
            courses: userCourses ? userCourses.map(course => course.title) : undefined
        };
        
        // Ajouter le nouveau message de l'utilisateur
        const userMessage = {
            role: 'user',
            content: message,
            timestamp: new Date()
        };
        
        conversation.messages.push(userMessage);
        
        // Générer une réponse via notre modèle Python
        const aiResponse = await getPrediction(message, userInfo);
        
        if (!aiResponse || !aiResponse.response) {
            return res.status(500).json({
                success: false,
                message: "Erreur lors de la génération de la réponse"
            });
        }
        
        // Ajouter la réponse à la conversation
        const assistantMessage = {
            role: 'assistant',
            content: aiResponse.response,
            timestamp: new Date()
        };
        
        conversation.messages.push(assistantMessage);
        
        // Mettre à jour le titre de la conversation s'il s'agit du premier message utilisateur
        if (conversation.messages.filter(msg => msg.role === 'user').length === 1) {
            // Créer un titre basé sur le premier message (limité à 40 caractères)
            const titlePreview = message.length > 40 ? message.substring(0, 37) + '...' : message;
            conversation.title = titlePreview;
        }
        
        await conversation.save();
        
        res.status(200).json({
            success: true,
            data: {
                userMessage,
                assistantMessage,
                intent: aiResponse.intent,
                confidence: aiResponse.confidence
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de l'envoi du message",
            error: error.message
        });
    }
};

// Supprimer une conversation
exports.deleteConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        
        const conversation = await Conversation.findByIdAndDelete(conversationId);
        
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation non trouvée"
            });
        }
        
        res.status(200).json({
            success: true,
            message: "Conversation supprimée avec succès"
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de la conversation:', error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la suppression de la conversation",
            error: error.message
        });
    }
};

// Entraîner le modèle (nouvelle route)
exports.trainChatbotModel = async (req, res) => {
    try {
        const result = await trainModel();
        
        res.status(200).json({
            success: true,
            message: "Modèle entraîné avec succès",
            data: result
        });
    } catch (error) {
        console.error('Erreur lors de l\'entraînement du modèle:', error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de l'entraînement du modèle",
            error: error.message
        });
    }
};
