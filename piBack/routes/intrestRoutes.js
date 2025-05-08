const express = require('express');
const router = express.Router();
const { initializePoints, getInterestPoints,updateUserInterestPoints ,deleteUserInterestPoint,updateInterestPointActivation
    ,addInterestPoint,updateInterestPoint ,getInterestPointforadmin
} = require('../controllers/intrestpoint'); // Adapté à votre structure

// Route pour initialiser les points d'intérêt
router.post('/initialize-points', initializePoints);

// Route pour récupérer les points d'intérêt
router.get('/interest-points', getInterestPoints);
router.get('/interest-points-admin', getInterestPointforadmin);
router.put('/user/:userId/interest-points',updateUserInterestPoints );
router.delete('/user/:userId/interest-point', deleteUserInterestPoint);
router.put('/interest-point/:id', updateInterestPointActivation);
// Route pour ajouter un nouveau point d'intérêt
router.post('/interest-points', addInterestPoint); // Nouvelle route pour l'ajout

router.put('/api/interest-point/:id', updateInterestPoint); // Mise à jour

module.exports = router;