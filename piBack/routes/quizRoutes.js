const express = require('express');
const router = require('express').Router();
const quizController = require('../controllers/quizcontroller');

// Student quiz routes
router.get('/student/:id', quizController.getQuizForStudent);
router.post('/submit', quizController.submitQuiz);

// Quiz course management
router.get('/course/:courseId', quizController.getQuizzesByCourse);

// Admin quiz routes
router.get('/', quizController.find);
router.get('/:id', quizController.findById);
router.post('/', quizController.create);
router.put('/:id', quizController.update);
router.delete('/:id', quizController.delete);

// Question management
router.post('/:id/question', quizController.addQuestion);
router.delete('/:id/question/:questionId', quizController.removeQuestion);

module.exports = router;