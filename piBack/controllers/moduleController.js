const Module = require('../Model/Module');
const Course = require('../Model/Course');

// Get all modules
const getAllModules = async (req, res) => {
    try {
        const modules = await Module.find()
            .populate('category')
            .sort({ createdAt: -1 });
        res.json(modules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get modules by category ID
const getModulesByCategory = async (req, res) => {
    try {
        const modules = await Module.find({ category: req.params.categoryId })
            .populate('category')
            .sort({ createdAt: -1 });
        res.json(modules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a single module by ID
const getModuleById = async (req, res) => {
    try {
        const module = await Module.findById(req.params.id)
            .populate('category');
        if (!module) {
            return res.status(404).json({ error: 'Module not found' });
        }
        res.json(module);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add a module
const createModule = async (req, res) => {
    try {
        const module = new Module(req.body);
        await module.save();
        res.status(201).json(module);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Edit module
const updateModule = async (req, res) => {
    try {
        const module = await Module.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        ).populate('category');
        if (!module) return res.status(404).json({ error: 'Module not found' });
        res.json(module);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete module
const deleteModule = async (req, res) => {
    try {
        const module = await Module.findByIdAndDelete(req.params.id);
        if (!module) return res.status(404).json({ error: 'Module not found' });
        res.json({ message: 'Module deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get module suggestions
const getModuleSuggestions = async (req, res) => {
    try {
        const modules = await Module.find()
            .populate('category')
            .sort({ popularity: -1 })
            .limit(10);
        res.json(modules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get module statistics
const getModuleStatistics = async (req, res) => {
    try {
        const module = await Module.findById(req.params.id).populate('category');
        if (!module) return res.status(404).json({ error: 'Module not found' });
        
        // Pour l'instant, on retourne juste le module
        // Plus tard, on pourra ajouter des statistiques plus détaillées
        res.json(module);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllModules,
    getModulesByCategory,
    getModuleById,
    createModule,
    updateModule,
    deleteModule,
    getModuleSuggestions,
    getModuleStatistics
};
