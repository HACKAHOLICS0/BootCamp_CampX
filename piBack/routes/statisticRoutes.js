const express = require('express');
const { getCourseStatistics, getModuleStatistics, getQuizStatistics, getCategoryStatistics } = require('../controllers/statisticController');
const router = express.Router();

router.get('/courses', getCourseStatistics);
router.get('/modules', getModuleStatistics);
router.get('/quizzes', getQuizStatistics);
router.get('/categories', getCategoryStatistics);

module.exports = router;
