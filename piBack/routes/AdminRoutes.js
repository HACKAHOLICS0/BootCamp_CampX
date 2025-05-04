const express = require("express");
const User = require('../Model/User');
const Category = require('../Model/Category');
const Module = require('../Model/Module');
const Course = require('../Model/Course');
const { getUsers, updateUser, deleteUser } = require("../controllers/AdminController"); // ✅ Fixed case-sensitive import

const router = express.Router();

// Route to get all users (only typeUser: "user")
router.get("/users", getUsers);

// Route to update a user by ID
router.put("/users/:id", updateUser);

// Route to delete a user by ID
router.delete("/users/:id", deleteUser);


// Route pour compter les utilisateurs
router.get('/users/count', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Erreur count users:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour compter les catégories
router.get('/categories/count', async (req, res) => {
  try {
    const count = await Category.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Erreur count categories:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour compter les modules
router.get('/modules/count', async (req, res) => {
  try {
    const count = await Module.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Erreur count modules:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour compter les cours
router.get('/courses/count', async (req, res) => {
  try {
    const count = await Course.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Erreur count courses:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour obtenir les données mensuelles d'utilisateurs
router.get('/users/monthly', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    // Récupérer tous les utilisateurs créés cette année
    const users = await User.find({
      createdAt: { $gte: startOfYear }
    }).select('createdAt');

    // Initialiser un tableau pour compter les utilisateurs par mois
    const monthlyUsers = Array(12).fill(0);

    // Compter les utilisateurs par mois
    users.forEach(user => {
      const month = new Date(user.createdAt).getMonth();
      monthlyUsers[month]++;
    });

    // Formater les données pour le frontend
    const result = monthlyUsers.map((count, index) => ({
      month: index + 1,
      count
    }));

    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération des données mensuelles:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour obtenir les activités récentes
router.get('/activities/recent', async (req, res) => {
  try {
    // Récupérer les derniers utilisateurs inscrits
    const recentUsers = await User.find({ typeUser: 'user' })
      .sort({ createdAt: -1 })
      .limit(2)
      .select('name createdAt');

    // Récupérer les derniers cours ajoutés
    const recentCourses = await Course.find()
      .sort({ createdAt: -1 })
      .limit(2)
      .select('title createdAt');

    // Récupérer les derniers modules ajoutés
    const recentModules = await Module.find()
      .sort({ createdAt: -1 })
      .limit(2)
      .select('title createdAt');

    // Formater les données pour le frontend
    const activities = [
      ...recentUsers.map(user => ({
        type: 'user',
        title: 'Nouvel utilisateur inscrit',
        description: `${user.name} a rejoint la plateforme`,
        date: user.createdAt
      })),
      ...recentCourses.map(course => ({
        type: 'cours',
        title: 'Nouveau cours ajouté',
        description: course.title,
        date: course.createdAt
      })),
      ...recentModules.map(module => ({
        type: 'module',
        title: 'Module mis à jour',
        description: module.title,
        date: module.createdAt
      }))
    ];

    // Trier par date (du plus récent au plus ancien)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(activities);
  } catch (error) {
    console.error('Erreur lors de la récupération des activités récentes:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;