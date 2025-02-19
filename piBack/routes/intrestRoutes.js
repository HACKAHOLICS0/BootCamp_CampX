const express = require('express');
const router = express.Router();
const { initializePoints, getInterestPoints,updateUserInterestPoints ,deleteUserInterestPoint} = require('../controllers/intrestpoint'); // Adapté à votre structure

// Route pour initialiser les points d'intérêt
router.post('/initialize-points', initializePoints);

// Route pour récupérer les points d'intérêt
router.get('/interest-points', getInterestPoints);
router.put('/user/:userId/interest-points',updateUserInterestPoints );
router.put('/user/:userId/delete-point', deleteUserInterestPoint); 
module.exports = router;