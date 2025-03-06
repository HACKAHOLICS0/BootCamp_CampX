const Course = require('../Model/Course');
const User = require('../Model/User');
const Module = require('../Model/Module');

// Get all courses
const getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find()
            .populate('module')
            .sort({ createdAt: -1 });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add a course
const createCourse = async (req, res) => {
    try {
        const course = new Course(req.body);
        await course.save();
        res.status(201).json(course);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Edit a course
const updateCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );
        if (!course) return res.status(404).json({ error: 'Course not found' });
        res.json(course);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Archive a course
const archiveCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { isArchived: true, updatedAt: Date.now() },
            { new: true }
        );
        if (!course) return res.status(404).json({ error: 'Course not found' });
        res.json(course);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get courses by module
const getCoursesByModule = async (req, res) => {
    try {
        const courses = await Course.find({ 
            module: req.params.moduleId,
            isArchived: false 
        }).populate('module');
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Purchase a course
const purchaseCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ error: 'Course not found' });
        
        if (course.purchasedBy.includes(req.user._id)) {
            return res.status(400).json({ error: 'Course already purchased' });
        }
        
        course.purchasedBy.push(req.user._id);
        await course.save();
        
        res.json({ message: 'Course purchased successfully', course });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllCourses,
    createCourse,
    updateCourse,
    archiveCourse,
    getCoursesByModule,
    purchaseCourse
};
