const mongoose = require('mongoose');
const interestPointModel = require('../Model/Interestpoint'); // Ton modèle
const User = require('../Model/User'); // Vérifiez que le modèle User est bien importé

const defaultPoints = [
    { value: "PHP" },
    { value: "REACT" },
    { value: "BIG DATA" },
    { value: "ANGULAR" },
    { value: "NODE" }
];

const initializePoints = async () => {
    try {
        // Vérifier si la collection est vide
        const count = await interestPointModel.countDocuments();

        // Si la collection est vide, insérer les points d'intérêt par défaut
        if (count === 0) {
            await interestPointModel.insertMany(defaultPoints);
            console.log("Points d'intérêt par défaut ajoutés dans la base de données.");
        } else {
            console.log("Les points d'intérêt existent déjà dans la base de données.");
        }
    } catch (err) {
        console.error("Erreur lors de l'initialisation des points d'intérêt:", err);
    }
};


// Nouvelle fonction pour récupérer les points d'intérêt
async function getInterestPoints(req, res) {
    try {
        const points = await interestPointModel.find();
        res.status(200).json(points);
    } catch (err) {
        console.error("Erreur lors de la récupération des points d'intérêt:", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
}
async function updateUserInterestPoints(req, res) {
    try {
        const { userId } = req.params;
        console.log("User ID reçu :", userId);

        if (!userId) {
            return res.status(400).json({ message: "ID utilisateur manquant" });
        }

        const { selectedPoints } = req.body;

        if (!selectedPoints) {
            return res.status(400).json({ message: "Aucun point d'intérêt sélectionné" });
        }

        // Fusionner les points d'intérêt existants avec les nouveaux
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Fusionner les anciens points d'intérêt avec les nouveaux
        const updatedInterestPoints = [...new Set([...user.refinterestpoints, ...selectedPoints])];

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { refinterestpoints: updatedInterestPoints } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Erreur lors de la mise à jour des points d'intérêt de l'utilisateur:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
}

async function deleteUserInterestPoint(req, res) {
    try {
        const { userId } = req.params;
        const { point } = req.body;  // Point d'intérêt à supprimer

        if (!userId || !point) {
            return res.status(400).json({ message: "ID utilisateur ou point d'intérêt manquant" });
        }

        // Trouver l'utilisateur
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        if (!user.refinterestpoints.includes(point)) {
            return res.status(400).json({ message: "Point d'intérêt non trouvé dans la liste" });
        }

        // Utiliser $pull pour supprimer le point d'intérêt du tableau refinterestpoints
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $pull: { refinterestpoints: point } },  // Suppression du point d'intérêt
            { new: true }
        );

        res.status(200).json({ message: "Point d'intérêt supprimé avec succès", updatedUser });
    } catch (err) {
        console.error("Erreur lors de la suppression du point d'intérêt de l'utilisateur:", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
}

module.exports = { initializePoints , getInterestPoints,updateUserInterestPoints,deleteUserInterestPoint  };