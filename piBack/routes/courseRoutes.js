const express = require('express');
const router = express.Router();
const {
    createCourse,
    updateCourse,
    archiveCourse,
    getCoursesByModule,
    getCoursesByCategory,
    purchaseCourse,
    getAllCourses,
    getCourseDetails,
    saveQuizResponse,
    addCodeExample,
    updateCodeExample,
    deleteCodeExample
} = require('../controllers/courseController');
const auth = require('../middleware/auth');

// Routes publiques (accessibles à tous)
// Get all courses (Public)
router.get('/', getAllCourses);

// Get courses by module
router.get('/module/:moduleId', getCoursesByModule);

// Get courses by category
router.get('/category/:category', getCoursesByCategory);

// Get details of a specific course with videos and quizzes
router.get('/details/:id', getCourseDetails);

// Routes qui nécessitent des privilèges d'administrateur
// Add a course to a module
router.post('/', auth, createCourse);

// Edit a course
router.patch('/:id', auth, updateCourse);

// Archive a course
router.patch('/:id/archive', auth, archiveCourse);

// Routes qui nécessitent authentification (mais pas forcément admin)
// Purchase a course
router.post('/:id/purchase', purchaseCourse);

// Save quiz response
router.post('/save-quiz-response', saveQuizResponse);

// Code examples routes
// Add code example to course
router.post('/:courseId/code-examples', auth, addCodeExample);

// Update code example
router.put('/:courseId/code-examples/:exampleId', auth, updateCodeExample);

// Delete code example
router.delete('/:courseId/code-examples/:exampleId', auth, deleteCodeExample);

module.exports = router;