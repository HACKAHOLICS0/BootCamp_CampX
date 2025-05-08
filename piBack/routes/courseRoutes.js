const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const {
    getAllCourses,
    getCoursesByModule,
    getCourseById,
    createCourse,
    updateCourse,
    purchaseCourse,
    addQuizToCourse,
    removeQuizFromCourse,
    archiveCourse,
    getPurchasedCourses
} = require('../controllers/courseController');

// Public routes
router.get('/', getAllCourses);
router.get('/module/:moduleId', getCoursesByModule);
router.get('/purchased', authMiddleware, getPurchasedCourses);
router.post('/:courseId/purchase', authMiddleware, purchaseCourse);
router.get('/:id', getCourseById);

// Protected routes - require authentication
router.post('/:courseId/purchase', authMiddleware, purchaseCourse);

// Admin routes - require authentication and admin role
router.post('/', [authMiddleware, adminMiddleware], createCourse);
router.patch('/:id', [authMiddleware, adminMiddleware], updateCourse);
router.patch('/:id/archive', [authMiddleware, adminMiddleware], archiveCourse);

// Quiz management routes
router.post('/:courseId/quiz/:quizId', [authMiddleware, adminMiddleware], addQuizToCourse);
router.delete('/:courseId/quiz/:quizId', [authMiddleware, adminMiddleware], removeQuizFromCourse);

module.exports = router;
