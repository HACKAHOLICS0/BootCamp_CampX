const express = require('express');
const router = express.Router();
const { 
    createCategory,
    updateCategory,
    deleteCategory,
    getAllCategories,
    getCategoryById
} = require('../controllers/categoryController');

// Get all categories (Public)
router.get('/', getAllCategories);

// Get a single category by ID (Public)
router.get('/:id', getCategoryById);

// Add a category (Admin only)
router.post('/', createCategory);

// Edit a category (Admin only)
router.patch('/:id', updateCategory);

// Delete a category (Admin only)
router.delete('/:id', deleteCategory);

module.exports = router;
