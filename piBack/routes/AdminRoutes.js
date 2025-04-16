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


module.exports = router;