const express = require('express');
const router = express.Router();
const {
    createModule,
    updateModule,
    deleteModule,
    getAllModules,
    getModulesByCategory,
    getModuleById,
    getModuleSuggestions,
    getModuleStatistics
} = require('../controllers/moduleController');

// Get all modules (Public)
router.get('/', getAllModules);

// Get modules by category ID (Public)
router.get('/category/:categoryId', getModulesByCategory);

// Get a single module by ID (Public)
router.get('/:id', getModuleById);

// Get module suggestions based on user preferences
router.get('/suggestions', getModuleSuggestions);

// Get module statistics (Admin only)
router.get('/statistics/:id', getModuleStatistics);

// Add a module (Admin only)
router.post('/', createModule);

// Edit module (Admin only)
router.patch('/:id', updateModule);

// Delete module (Admin only)
router.delete('/:id', deleteModule);

module.exports = router;
