const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// Routes protégées par authentification
router.get('/user', authMiddleware, certificateController.getUserCertificates);
router.get('/check/:quizId', authMiddleware, certificateController.checkUserCertificateForQuiz);
router.get('/:certificateId', authMiddleware, certificateController.getCertificateById);
router.get('/:certificateId/pdf', authMiddleware, certificateController.generateCertificatePDF);

// Route publique pour vérifier un certificat
router.get('/verify/:certificateNumber', certificateController.verifyCertificate);

module.exports = router;
