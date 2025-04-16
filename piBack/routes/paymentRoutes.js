const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
    createPaymentIntent,
    confirmPayment,
    webhookHandler,
    getUserPayments
} = require('../controllers/paymentController');

// Création d'une intention de paiement (nécessite authentification)
router.post('/create-payment-intent', auth, createPaymentIntent);

// Confirmation du paiement
router.post('/confirm-payment', auth, confirmPayment);

// Webhook pour Stripe (pas d'authentification requise - vient de Stripe)
// Le middleware express.raw() doit être appliqué UNIQUEMENT à cette route
router.post('/webhook', express.raw({ type: 'application/json' }), webhookHandler);

// Historique des paiements d'un utilisateur
router.get('/history', auth, getUserPayments);

module.exports = router;