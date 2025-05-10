const express = require("express");
const User = require('../Model/User');
const Category = require('../Model/Category');
const Module = require('../Model/Module');
const Course = require('../Model/Course');
const Quiz = require('../Model/Quiz');
const QuizResult = require('../Model/QuizResult');
const Certificate = require('../Model/Certificate');
const Payment = require('../Model/Payment');
const Event = require('../Model/Event');
const { getUsers, updateUser, deleteUser } = require("../controllers/AdminController"); // ✅ Fixed case-sensitive import

const router = express.Router();

// Route to get all users (only typeUser: "user")
router.get("/users", getUsers);

// Route to update a user by ID
router.put("/users/:id", updateUser);

// Route to delete a user by ID
router.delete("/users/:id", deleteUser);


// Route pour compter les utilisateurs
router.get('/users/count', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Erreur count users:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour compter les catégories
router.get('/categories/count', async (req, res) => {
  try {
    const count = await Category.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Erreur count categories:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour compter les modules
router.get('/modules/count', async (req, res) => {
  try {
    const count = await Module.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Erreur count modules:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour compter les cours
router.get('/courses/count', async (req, res) => {
  try {
    const count = await Course.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Erreur count courses:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour obtenir les données mensuelles d'utilisateurs
router.get('/users/monthly', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    // Récupérer tous les utilisateurs créés cette année
    const users = await User.find({
      createdAt: { $gte: startOfYear }
    }).select('createdAt');

    // Initialiser un tableau pour compter les utilisateurs par mois
    const monthlyUsers = Array(12).fill(0);

    // Compter les utilisateurs par mois
    users.forEach(user => {
      const month = new Date(user.createdAt).getMonth();
      monthlyUsers[month]++;
    });

    // Formater les données pour le frontend
    const result = monthlyUsers.map((count, index) => ({
      month: index + 1,
      count
    }));

    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération des données mensuelles:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour obtenir les statistiques des quiz
router.get('/quizzes/count', async (req, res) => {
  try {
    const count = await Quiz.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Erreur count quizzes:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour obtenir les statistiques des certificats
router.get('/certificates/count', async (req, res) => {
  try {
    const count = await Certificate.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Erreur count certificates:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour obtenir le total des paiements
router.get('/payments/total', async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'succeeded' });
    const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
    res.json({ total });
  } catch (error) {
    console.error('Erreur total payments:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour obtenir les statistiques des événements
router.get('/events/count', async (req, res) => {
  try {
    const count = await Event.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Erreur count events:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour obtenir les statistiques détaillées des utilisateurs
router.get('/users/stats', async (req, res) => {
  try {
    // Compter les utilisateurs vérifiés et non vérifiés
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const unverifiedUsers = await User.countDocuments({ isVerified: false });

    // Compter les utilisateurs par méthode d'authentification
    const googleUsers = await User.countDocuments({ authProvider: 'google' });
    const githubUsers = await User.countDocuments({ authProvider: 'github' });
    const localUsers = await User.countDocuments({ authProvider: 'local' });

    // Calculer la moyenne des cours par utilisateur
    const users = await User.find();
    const totalEnrolledCourses = users.reduce((total, user) => total + (user.enrolledCourses?.length || 0), 0);
    const averageCoursesPerUser = users.length > 0 ? totalEnrolledCourses / users.length : 0;

    // Trouver les utilisateurs les plus actifs
    const usersWithEnrollments = await User.find()
      .populate('enrolledCourses.courseId')
      .sort({ 'enrolledCourses.length': -1 })
      .limit(5);

    const mostActiveUsers = usersWithEnrollments.map(user => {
      const quizCount = user.enrolledCourses.reduce((total, enrollment) => total + enrollment.quizzesCompleted, 0);
      return {
        name: user.name || 'Utilisateur',
        courses: user.enrolledCourses.length,
        quizzes: quizCount
      };
    });

    res.json({
      verifiedUsers,
      unverifiedUsers,
      googleUsers,
      githubUsers,
      localUsers,
      averageCoursesPerUser,
      mostActiveUsers
    });
  } catch (error) {
    console.error('Erreur user stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour obtenir les statistiques détaillées des cours
router.get('/courses/stats', async (req, res) => {
  try {
    // Récupérer tous les cours
    const courses = await Course.find().populate('module');

    // Calculer le nombre total d'inscriptions
    const totalEnrollments = courses.reduce((total, course) => total + (course.purchasedBy?.length || 0), 0);

    // Calculer le prix moyen des cours
    const totalPrice = courses.reduce((total, course) => total + course.price, 0);
    const averagePrice = courses.length > 0 ? totalPrice / courses.length : 0;

    // Calculer la durée totale des cours
    const totalDuration = courses.reduce((total, course) => total + course.duration, 0);

    // Trouver les cours les plus populaires
    const coursesWithEnrollments = courses.map(course => ({
      title: course.title,
      enrollments: course.purchasedBy?.length || 0
    })).sort((a, b) => b.enrollments - a.enrollments).slice(0, 5);

    // Regrouper les cours par catégorie
    const coursesByCategory = [];
    const categoryCounts = {};

    for (const course of courses) {
      if (course.module && course.module.category) {
        const categoryId = course.module.category.toString();
        if (categoryCounts[categoryId]) {
          categoryCounts[categoryId].count++;
        } else {
          const category = await Category.findById(categoryId);
          categoryCounts[categoryId] = {
            category: category ? category.name : 'Inconnu',
            count: 1
          };
        }
      }
    }

    for (const key in categoryCounts) {
      coursesByCategory.push(categoryCounts[key]);
    }

    // Trier par nombre de cours décroissant
    coursesByCategory.sort((a, b) => b.count - a.count);

    // Calculer le taux moyen de complétion (simulé pour l'exemple)
    const averageCompletionRate = 68; // Valeur simulée

    res.json({
      totalEnrollments,
      averagePrice,
      mostPopularCourses: coursesWithEnrollments,
      coursesByCategory,
      averageCompletionRate,
      totalDuration
    });
  } catch (error) {
    console.error('Erreur course stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour obtenir les statistiques détaillées des catégories
router.get('/categories/stats', async (req, res) => {
  try {
    // Récupérer toutes les catégories
    const categories = await Category.find();

    // Calculer le nombre moyen de cours par catégorie
    const modules = await Module.find().populate('category');
    const courses = await Course.find().populate('module');

    const categoriesWithCourses = [];
    const categoriesWithUsers = [];

    // Pour chaque catégorie, compter les cours et les utilisateurs
    for (const category of categories) {
      // Compter les modules de cette catégorie
      const categoryModules = modules.filter(module =>
        module.category && module.category._id.toString() === category._id.toString()
      );

      // Compter les cours de ces modules
      let courseCount = 0;
      let userCount = 0;
      const uniqueUsers = new Set();

      for (const module of categoryModules) {
        const moduleCourses = courses.filter(course =>
          course.module && course.module._id.toString() === module._id.toString()
        );

        courseCount += moduleCourses.length;

        // Compter les utilisateurs uniques inscrits aux cours de cette catégorie
        for (const course of moduleCourses) {
          if (course.purchasedBy && course.purchasedBy.length > 0) {
            course.purchasedBy.forEach(userId => uniqueUsers.add(userId.toString()));
          }
        }
      }

      userCount = uniqueUsers.size;

      categoriesWithCourses.push({
        name: category.name,
        courses: courseCount
      });

      categoriesWithUsers.push({
        name: category.name,
        users: userCount
      });
    }

    // Trier par nombre de cours décroissant
    categoriesWithCourses.sort((a, b) => b.courses - a.courses);

    // Trier par nombre d'utilisateurs décroissant
    categoriesWithUsers.sort((a, b) => b.users - a.users);

    // Calculer la moyenne de cours par catégorie
    const totalCourses = categoriesWithCourses.reduce((total, cat) => total + cat.courses, 0);
    const averageCoursesPerCategory = categories.length > 0 ? totalCourses / categories.length : 0;

    res.json({
      categoriesWithMostCourses: categoriesWithCourses.slice(0, 5),
      categoriesWithMostUsers: categoriesWithUsers.slice(0, 5),
      averageCoursesPerCategory
    });
  } catch (error) {
    console.error('Erreur category stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour obtenir les statistiques détaillées des quiz
router.get('/quizzes/stats', async (req, res) => {
  try {
    // Récupérer tous les quiz
    const quizzes = await Quiz.find();

    // Récupérer tous les résultats de quiz
    const quizResults = await QuizResult.find().populate('quiz');

    // Calculer le score moyen
    const totalScore = quizResults.reduce((total, result) => total + result.percentage, 0);
    const averageScore = quizResults.length > 0 ? Math.round(totalScore / quizResults.length) : 0;

    // Calculer le temps moyen par quiz
    const totalTime = quizResults.reduce((total, result) => total + result.timeSpent, 0);
    const averageTimePerQuiz = quizResults.length > 0 ? Math.round(totalTime / quizResults.length / 60) : 0; // Convertir en minutes

    // Calculer le taux de complétion par quiz
    const quizCompletionRates = {};
    const quizScores = {};

    for (const result of quizResults) {
      if (result.quiz) {
        const quizId = result.quiz._id.toString();

        // Compter les tentatives pour ce quiz
        if (!quizCompletionRates[quizId]) {
          quizCompletionRates[quizId] = {
            title: result.quiz.title,
            attempts: 0,
            completions: 0
          };
        }

        quizCompletionRates[quizId].attempts++;

        // Considérer comme complété si le score est >= 70%
        if (result.percentage >= 70) {
          quizCompletionRates[quizId].completions++;
        }

        // Calculer le score moyen pour ce quiz
        if (!quizScores[quizId]) {
          quizScores[quizId] = {
            title: result.quiz.title,
            totalScore: 0,
            count: 0
          };
        }

        quizScores[quizId].totalScore += result.percentage;
        quizScores[quizId].count++;
      }
    }

    // Calculer les taux de complétion finaux
    const quizzesWithCompletionRates = Object.values(quizCompletionRates).map(quiz => ({
      title: quiz.title,
      completion: quiz.attempts > 0 ? Math.round((quiz.completions / quiz.attempts) * 100) : 0
    }));

    // Calculer les scores moyens finaux
    const quizzesWithScores = Object.values(quizScores).map(quiz => ({
      title: quiz.title,
      score: quiz.count > 0 ? Math.round(quiz.totalScore / quiz.count) : 0
    }));

    // Trier par taux de complétion décroissant
    quizzesWithCompletionRates.sort((a, b) => b.completion - a.completion);

    // Trier par score croissant pour trouver les plus bas
    quizzesWithScores.sort((a, b) => a.score - b.score);

    res.json({
      averageScore,
      quizzesWithHighestCompletion: quizzesWithCompletionRates.slice(0, 5),
      quizzesWithLowestScores: quizzesWithScores.slice(0, 5),
      totalQuizAttempts: quizResults.length,
      averageTimePerQuiz
    });
  } catch (error) {
    console.error('Erreur quiz stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour obtenir les activités récentes
router.get('/activities/recent', async (req, res) => {
  try {
    // Récupérer les derniers utilisateurs inscrits
    const recentUsers = await User.find({ typeUser: 'user' })
      .sort({ createdAt: -1 })
      .limit(2)
      .select('name createdAt');

    // Récupérer les derniers cours ajoutés
    const recentCourses = await Course.find()
      .sort({ createdAt: -1 })
      .limit(2)
      .select('title createdAt');

    // Récupérer les derniers modules ajoutés
    const recentModules = await Module.find()
      .sort({ createdAt: -1 })
      .limit(2)
      .select('title createdAt');

    // Formater les données pour le frontend
    const activities = [
      ...recentUsers.map(user => ({
        type: 'user',
        title: 'Nouvel utilisateur inscrit',
        description: `${user.name} a rejoint la plateforme`,
        date: user.createdAt
      })),
      ...recentCourses.map(course => ({
        type: 'cours',
        title: 'Nouveau cours ajouté',
        description: course.title,
        date: course.createdAt
      })),
      ...recentModules.map(module => ({
        type: 'module',
        title: 'Module mis à jour',
        description: module.title,
        date: module.createdAt
      }))
    ];

    // Trier par date (du plus récent au plus ancien)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(activities);
  } catch (error) {
    console.error('Erreur lors de la récupération des activités récentes:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;