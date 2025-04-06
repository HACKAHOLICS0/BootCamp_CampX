const mongoose = require('mongoose');
const interestPointModel = require('../Model/Interestpoint'); // Ton modèle
const User = require('../Model/User'); // Vérifiez que le modèle User est bien importé

// Liste des points d'intérêt par défaut
const defaultPoints = [
    { value: "PHP" },
    { value: "REACT" },
    { value: "BIG DATA" },
    { value: "ANGULAR" },
    { value: "NODE" }
];

// Fonction d'initialisation des points d'intérêt
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

// Fonction pour récupérer les points d'intérêt
async function getInterestPoints(req, res) {
    try {
        // Récupérer tous les points d'intérêt sans filtrer par isActive
        const points = await interestPointModel.find({});
        res.status(200).json(points);
    } catch (err) {
        console.error("Erreur lors de la récupération des points d'intérêt:", err);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des points d'intérêt" });
    }
}
async function getInterestPointforadmin(req, res) {
    try {
        const points = await interestPointModel.find({  });
        res.status(200).json(points);
    } catch (err) {
        console.error("Erreur lors de la récupération des points d'intérêt:", err);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des points d'intérêt" });
    }
}


// Fonction pour mettre à jour les points d'intérêt d'un utilisateur
async function updateUserInterestPoints(req, res) {
    try {
        const { userId } = req.params;
        const { selectedPoints } = req.body;

        // Vérification des paramètres requis
        if (!userId) {
            return res.status(400).json({ message: "ID utilisateur manquant" });
        }
        if (!selectedPoints || !Array.isArray(selectedPoints) || selectedPoints.length === 0) {
            return res.status(400).json({ message: "Aucun point d'intérêt sélectionné" });
        }

        // Trouver l'utilisateur dans la base de données
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Fusionner les anciens points d'intérêt avec les nouveaux
        const updatedInterestPoints = [...new Set([...user.refinterestpoints, ...selectedPoints])];

        // Mettre à jour l'utilisateur avec les nouveaux points d'intérêt
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { refinterestpoints: updatedInterestPoints } },
            { new: true }
        );

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Erreur lors de la mise à jour des points d'intérêt de l'utilisateur:", error);
        res.status(500).json({ message: "Erreur serveur lors de la mise à jour" });
    }
}

// Fonction pour supprimer un point d'intérêt d'un utilisateur
async function deleteUserInterestPoint(req, res) {
    try {
        const { userId } = req.params;
        const { point } = req.body;

        // Vérification des paramètres requis
        if (!userId || !point) {
            return res.status(400).json({ message: "ID utilisateur ou point d'intérêt manquant" });
        }

        // Trouver l'utilisateur dans la base de données
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Vérifier si le point d'intérêt existe dans la liste de l'utilisateur
        if (!user.refinterestpoints.includes(point)) {
            return res.status(400).json({ message: "Point d'intérêt non trouvé dans la liste" });
        }

        // Supprimer le point d'intérêt de l'utilisateur
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $pull: { refinterestpoints: point } },
            { new: true }
        );

        res.status(200).json({ message: "Point d'intérêt supprimé avec succès", updatedUser });
    } catch (err) {
        console.error("Erreur lors de la suppression du point d'intérêt:", err);
        res.status(500).json({ message: "Erreur serveur lors de la suppression" });
    }
}
// Fonction pour activer/désactiver un point d'intérêt
async function updateInterestPointActivation(req, res) {
    try {
        const { id } = req.params;
        const { isActive } = req.body; // La valeur de l'activation (true ou false)

        // Vérifier si l'ID est fourni
        if (!id) {
            return res.status(400).json({ message: "ID du point d'intérêt manquant" });
        }

        // Trouver le point d'intérêt dans la base de données
        const point = await interestPointModel.findById(id);
        if (!point) {
            return res.status(404).json({ message: "Point d'intérêt non trouvé" });
        }

        // Mettre à jour l'état d'activation du point d'intérêt
        point.isActive = isActive;

        // Sauvegarder les modifications
        await point.save();

        res.status(200).json({ message: "Point d'intérêt mis à jour", point });
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'activation du point d'intérêt:", error);
        res.status(500).json({ message: "Erreur serveur lors de la mise à jour" });
    }
}

async function addInterestPoint(req, res) {
    try {
        const { value } = req.body; // Récupérer la valeur du point d'intérêt à partir du corps de la requête

        // Vérification si la valeur est fournie
        if (!value) {
            return res.status(400).json({ message: "Point value is required" });
        }

        // Créer un nouveau point d'intérêt
        const newPoint = new interestPointModel({
            value,
        });

        // Sauvegarder le nouveau point dans la base de données
        await newPoint.save();

        res.status(201).json(newPoint); // Répondre avec le point ajouté
    } catch (err) {
        console.error("Error adding new interest point:", err);
        res.status(500).json({ message: "Server error while adding point" });
    }
}
const updateInterestPoint = async (req, res) => {
    try {
        const { id } = req.params;
        const { value } = req.body;

        console.log("ID reçu:", id);  // Vérifier l'ID
        console.log("Nouvelle valeur reçue:", value);  // Vérifier la nouvelle valeur

        if (!id || !value) {
            return res.status(400).json({ message: "ID et valeur du point d'intérêt requis" });
        }

        const point = await interestPointModel.findById(id);
        if (!point) {
            return res.status(404).json({ message: "Point d'intérêt non trouvé" });
        }

        point.value = value;

        console.log("Point avant mise à jour:", point);  // Vérifier l'objet avant la mise à jour

        const updatedPoint = await point.save();
        console.log("Point mis à jour:", updatedPoint);  // Vérifier l'objet après la mise à jour

        res.status(200).json({ message: "Point mis à jour avec succès", point: updatedPoint });
    } catch (error) {
        console.error("Erreur lors de la mise à jour du point d'intérêt:", error);
        res.status(500).json({ message: "Erreur serveur lors de la mise à jour du point d'intérêt" });
    }
};



module.exports = { initializePoints, getInterestPoints, updateUserInterestPoints, deleteUserInterestPoint,updateInterestPointActivation, addInterestPoint,updateInterestPoint ,getInterestPointforadmin};
