const express = require('express');
const router = express.Router();
const {
    createCourse,
    updateCourse,
    archiveCourse,
    getCoursesByModule,
    purchaseCourse,
    getAllCourses,
    getCourseDetails
} = require('../controllers/courseController');

// Get all courses (Public)
router.get('/getAll', getAllCourses);
router.get('/getAllcourses', getAllCourses);

// Get courses by module
router.get('/module/:moduleId', getCoursesByModule);

// Get course details with quiz
router.get('/:id', getCourseDetails);

// Add a course to a module 
router.post('/', createCourse);

// Edit a course 
router.patch('/:id', updateCourse);

// Archive a course 
router.patch('/:id/archive', archiveCourse);

// Purchase a course
router.post('/:id/purchase', purchaseCourse);

module.exports = router;
