const Conversation = require('../Model/Conversation');
const User = require('../Model/User');
const { getPrediction } = require('../utils/pythonAiService');
const axios = require('axios');

const PYTHON_SERVICE_URL = 'http://127.0.0.1:5000/predict';

exports.createConversation = async (req, res) => {
    try {
        const { userId, message } = req.body;

        // Vérifier si l'utilisateur existe
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Récupérer la conversation existante ou en créer une nouvelle
        let conversation = await Conversation.findOne({ userId });
        if (!conversation) {
            conversation = new Conversation({
                userId,
                title: 'Nouvelle conversation',
                messages: []
            });
        }

        // Envoyer le message au modèle IA avec le contexte complet
        const aiResponse = await axios.post(PYTHON_SERVICE_URL, {
            message: message,
            context: {
                userId: userId,
                previousMessages: conversation.messages.map(m => ({
                    role: m.role,
                    content: m.content
                }))
            }
        });

        // Ajouter les messages à la conversation
        conversation.messages.push(
            { role: 'user', content: message },
            { role: 'assistant', content: aiResponse.data.response }
        );

        // Mettre à jour le titre si c'est le premier message
        if (conversation.messages.length === 2) {
            conversation.title = message.substring(0, 50);
        }

        await conversation.save();

        res.status(200).json({
            success: true,
            data: {
                conversation,
                aiResponse: aiResponse.data
            }
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

exports.getUserConversations = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const conversation = await Conversation.findOne({ userId })
            .sort({ updatedAt: -1 });

        if (!conversation) {
            return res.status(200).json({
                success: true,
                data: {
                    messages: []
                }
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

exports.sendMessage = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { message } = req.body;
        
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation non trouvée"
            });
        }

        // Envoyer le message au modèle IA avec le contexte complet
        const aiResponse = await axios.post(PYTHON_SERVICE_URL, {
            message: message,
            context: {
                userId: conversation.userId,
                previousMessages: conversation.messages.map(m => ({
                    role: m.role,
                    content: m.content
                }))
            }
        });

        // Ajouter les messages à la conversation
        const userMessage = {
            role: 'user',
            content: message,
            timestamp: new Date()
        };
        
        const assistantMessage = {
            role: 'assistant',
            content: aiResponse.data.response,
            timestamp: new Date()
        };

        conversation.messages.push(userMessage, assistantMessage);
        await conversation.save();

        res.status(200).json({
            success: true,
            data: {
                userMessage,
                assistantMessage,
                aiResponse: aiResponse.data
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
