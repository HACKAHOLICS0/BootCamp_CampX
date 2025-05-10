const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Basic count endpoints
router.get('/users/count', analyticsController.getUserCount);
router.get('/courses/count', analyticsController.getCourseCount);
router.get('/categories/count', analyticsController.getCategoryCount);
router.get('/modules/count', analyticsController.getModuleCount);
router.get('/quizzes/count', analyticsController.getQuizCount);
router.get('/certificates/count', analyticsController.getCertificateCount);
router.get('/events/count', analyticsController.getEventCount);
router.get('/payments/total', analyticsController.getTotalPayments);

// Detailed statistics endpoints
router.get('/overview', analyticsController.getOverviewStats);
router.get('/users/stats', analyticsController.getUserStats);
router.get('/courses/stats', analyticsController.getCourseStats);
router.get('/categories/stats', analyticsController.getCategoryStats);
router.get('/quizzes/stats', analyticsController.getQuizStats);
router.get('/payments/stats', analyticsController.getPaymentStats);

module.exports = router;
