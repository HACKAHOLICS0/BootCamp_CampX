const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Protéger toutes les routes avec l'authentification
router.use(authMiddleware);

// Routes pour les conversations
router.post('/conversations', chatController.createConversation);
router.get('/conversations/user/:userId', chatController.getUserConversations);
router.get('/conversations/:conversationId', chatController.getConversation);
router.post('/conversations/:conversationId/messages', chatController.sendMessage);
router.delete('/conversations/:conversationId', chatController.deleteConversation);

// Route pour entraîner le modèle (accès limité aux administrateurs)
router.post('/train-model', chatController.trainChatbotModel);

module.exports = router;
