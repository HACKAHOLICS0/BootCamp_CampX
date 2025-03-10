const Course = require('../Model/Course');
const Module = require('../Model/Module');
const Quiz = require('../Model/Quiz');
const Category = require('../Model/Category');

const getCourseStatistics = async (req, res) => {
    try {
        const courses = await Course.find().select('enrolledStudentsCount completionCount averageRating totalRevenue title');
        res.status(200).json({ courses });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques des cours', error });
    }
};

const getModuleStatistics = async (req, res) => {
    try {
        const modules = await Module.find().select('completionCount mostPopularCourse title');
        res.status(200).json({ modules });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques des modules', error });
    }
};

const getQuizStatistics = async (req, res) => {
    try {
        const quizzes = await Quiz.find().select('attemptCount averageScore passRate title');
        res.status(200).json({ quizzes });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques des quiz', error });
    }
};

const getCategoryStatistics = async (req, res) => {
    try {
        const categories = await Category.find().select('totalCourses totalStudents name');
        res.status(200).json({ categories });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques des catégories', error });
    }
};

module.exports = {
    getCourseStatistics,
    getModuleStatistics,
    getQuizStatistics,
    getCategoryStatistics
};
