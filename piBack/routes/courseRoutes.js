const express = require('express');
const router = require('express').Router();
const {
    getAllCourses,
    getCoursesByModule,
    getCourseById,
    createCourse,
    updateCourse,
    purchaseCourse,
    addQuizToCourse,
    removeQuizFromCourse,
    archiveCourse
} = require('../controllers/courseController');

// Course listing routes
router.get('/', getAllCourses);
router.get('/module/:moduleId', getCoursesByModule);
router.get('/:id', getCourseById);

// Course management routes
router.post('/', createCourse);
router.put('/:id', updateCourse);
router.patch('/:id/archive', archiveCourse);

// Course purchase route
router.post('/purchase/:courseId', purchaseCourse);

// Quiz management routes
router.post('/:courseId/quiz/:quizId', addQuizToCourse);
router.delete('/:courseId/quiz/:quizId', removeQuizFromCourse);

module.exports = router;
