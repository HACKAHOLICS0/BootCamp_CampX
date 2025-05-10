const Module = require('../Model/Module');
const Course = require('../Model/Course');
const mongoose = require('mongoose');

// Get all modules
const getAllModules = async (req, res) => {
    try {
        const modules = await Module.find()
            .populate('category')
            .sort({ createdAt: -1 });

        // Récupérer les statistiques pour chaque module
        const modulesWithStats = await Promise.all(modules.map(async (module) => {
            // Compter les cours pour ce module
            const courses = await Course.find({ module: module._id });

            // Calculer la durée totale
            const totalDuration = courses.reduce((total, course) => total + (course.duration || 0), 0);

            // Convertir en objet pour pouvoir ajouter des propriétés
            const moduleObj = module.toObject();

            // Ajouter les statistiques
            moduleObj.coursesCount = courses.length;
            moduleObj.duration = totalDuration;

            return moduleObj;
        }));

        res.json(modulesWithStats);
    } catch (error) {
        console.error('Error in getAllModules:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get modules by category ID
const getModulesByCategory = async (req, res) => {
    try {
        const modules = await Module.find({ category: req.params.categoryId })
            .populate('category')
            .sort({ createdAt: -1 });

        // Récupérer les statistiques pour chaque module
        const modulesWithStats = await Promise.all(modules.map(async (module) => {
            // Compter les cours pour ce module
            const courses = await Course.find({ module: module._id });

            // Calculer la durée totale
            const totalDuration = courses.reduce((total, course) => total + (course.duration || 0), 0);

            // Convertir en objet pour pouvoir ajouter des propriétés
            const moduleObj = module.toObject();

            // Ajouter les statistiques
            moduleObj.coursesCount = courses.length;
            moduleObj.duration = totalDuration;

            return moduleObj;
        }));

        res.json(modulesWithStats);
    } catch (error) {
        console.error('Error in getModulesByCategory:', error);
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

        // Compter les cours pour ce module
        const courses = await Course.find({ module: module._id });

        // Calculer la durée totale
        const totalDuration = courses.reduce((total, course) => total + (course.duration || 0), 0);

        // Convertir en objet pour pouvoir ajouter des propriétés
        const moduleObj = module.toObject();

        // Ajouter les statistiques
        moduleObj.coursesCount = courses.length;
        moduleObj.duration = totalDuration;

        res.json(moduleObj);
    } catch (error) {
        console.error('Error in getModuleById:', error);
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

        // Compter les cours pour ce module
        const courses = await Course.find({ module: module._id });

        // Calculer la durée totale
        const totalDuration = courses.reduce((total, course) => total + (course.duration || 0), 0);

        // Convertir en objet pour pouvoir ajouter des propriétés
        const moduleObj = module.toObject();

        // Ajouter les statistiques
        moduleObj.coursesCount = courses.length;
        moduleObj.duration = totalDuration;

        // Ajouter des statistiques supplémentaires si nécessaire
        const totalStudents = courses.reduce((total, course) => total + (course.purchasedBy?.length || 0), 0);
        moduleObj.totalStudents = totalStudents;

        res.json(moduleObj);
    } catch (error) {
        console.error('Error in getModuleStatistics:', error);
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
