const User = require('../Model/User');
const Course = require('../Model/Course');
const Category = require('../Model/Category');
const Module = require('../Model/Module');
const Quiz = require('../Model/Quiz');
const QuizResult = require('../Model/QuizResult');
const Certificate = require('../Model/Certificate');
const Payment = require('../Model/Payment');
const Event = require('../Model/Event');

// Basic count endpoints
exports.getUserCount = async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error counting users:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCourseCount = async (req, res) => {
  try {
    const count = await Course.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error counting courses:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCategoryCount = async (req, res) => {
  try {
    const count = await Category.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error counting categories:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getModuleCount = async (req, res) => {
  try {
    const count = await Module.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error counting modules:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getQuizCount = async (req, res) => {
  try {
    const count = await Quiz.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error counting quizzes:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCertificateCount = async (req, res) => {
  try {
    const count = await Certificate.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error counting certificates:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getEventCount = async (req, res) => {
  try {
    const count = await Event.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error counting events:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getTotalPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'succeeded' });
    const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
    res.json({ total });
  } catch (error) {
    console.error('Error calculating total payments:', error);
    res.status(500).json({ message: error.message });
  }
};

// Detailed statistics endpoints
exports.getUserStats = async (req, res) => {
  try {
    // Count verified and unverified users
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const unverifiedUsers = await User.countDocuments({ isVerified: false });

    // Count users by authentication provider
    const googleUsers = await User.countDocuments({ authProvider: 'google' });
    const githubUsers = await User.countDocuments({ authProvider: 'github' });
    const localUsers = await User.countDocuments({ authProvider: { $ne: 'google', $ne: 'github' } });

    // Calculate active users (users who logged in within the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } });

    // Calculate user retention rate (users who returned after their first visit)
    const totalUsers = await User.countDocuments();
    const usersWithMultipleLogins = await User.countDocuments({ loginCount: { $gt: 1 } });
    const userRetentionRate = totalUsers > 0 ? Math.round((usersWithMultipleLogins / totalUsers) * 100) : 0;

    // Calculate new users this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: firstDayOfMonth } });

    // Get most active users
    const mostActiveUsers = await User.aggregate([
      { $project: { name: 1, enrolledCourses: { $size: { $ifNull: ["$enrolledCourses", []] } }, quizAttempts: { $size: { $ifNull: ["$quizAttempts", []] } } } },
      { $sort: { enrolledCourses: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, name: 1, courses: "$enrolledCourses", quizzes: "$quizAttempts" } }
    ]);

    // Calculate average courses per user
    const averageCoursesPerUser = totalUsers > 0 ?
      (await User.aggregate([
        { $project: { enrolledCoursesCount: { $size: { $ifNull: ["$enrolledCourses", []] } } } },
        { $group: { _id: null, average: { $avg: "$enrolledCoursesCount" } } }
      ]))[0]?.average || 0 : 0;

    res.json({
      verifiedUsers,
      unverifiedUsers,
      googleUsers,
      githubUsers,
      localUsers,
      activeUsers,
      userRetentionRate,
      newUsersThisMonth,
      averageCoursesPerUser,
      mostActiveUsers,
      // Mock data for demonstration - would be replaced with real data in production
      usersByCountry: [
        { country: 'France', count: 45 },
        { country: 'Tunisie', count: 32 },
        { country: 'Maroc', count: 18 },
        { country: 'Algérie', count: 15 },
        { country: 'Autres', count: 10 }
      ],
      userGrowthByMonth: [
        { month: 'Jan', count: 8 },
        { month: 'Fév', count: 12 },
        { month: 'Mar', count: 15 },
        { month: 'Avr', count: 10 },
        { month: 'Mai', count: 18 },
        { month: 'Juin', count: 24 }
      ],
      averageSessionsPerUser: 5.2,
      deviceDistribution: {
        desktop: 65,
        mobile: 30,
        tablet: 5
      },
      userEngagementByTime: [
        { time: '8h-12h', percentage: 25 },
        { time: '12h-16h', percentage: 30 },
        { time: '16h-20h', percentage: 35 },
        { time: '20h-0h', percentage: 10 }
      ]
    });
  } catch (error) {
    console.error('Error calculating user stats:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCourseStats = async (req, res) => {
  try {
    // Get all courses
    const courses = await Course.find().populate('module');

    // Calculate total enrollments
    const totalEnrollments = courses.reduce((total, course) => {
      return total + (course.purchasedBy ? course.purchasedBy.length : 0);
    }, 0);

    // Calculate average price
    const totalPrice = courses.reduce((total, course) => total + (course.price || 0), 0);
    const averagePrice = courses.length > 0 ? totalPrice / courses.length : 0;

    // Calculate average rating
    const coursesWithRatings = courses.filter(course => course.rating && course.rating > 0);
    const totalRating = coursesWithRatings.reduce((total, course) => total + course.rating, 0);
    const averageRating = coursesWithRatings.length > 0 ? totalRating / coursesWithRatings.length : 0;

    // Get most popular courses
    const coursesWithEnrollments = courses.map(course => ({
      title: course.title,
      enrollments: course.purchasedBy ? course.purchasedBy.length : 0
    })).sort((a, b) => b.enrollments - a.enrollments).slice(0, 5);

    // Group courses by category
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
            category: category ? category.name : 'Unknown',
            count: 1
          };
        }
      }
    }

    for (const key in categoryCounts) {
      coursesByCategory.push(categoryCounts[key]);
    }

    // Sort by count in descending order
    coursesByCategory.sort((a, b) => b.count - a.count);

    res.json({
      totalEnrollments,
      averagePrice,
      averageRating,
      mostPopularCourses: coursesWithEnrollments,
      coursesByCategory,
      // Mock data for demonstration - would be replaced with real data in production
      averageCompletionRate: 68,
      totalDuration: 320,
      coursesWithHighestRevenue: [
        { title: 'Full Stack Web Development', revenue: 4500 },
        { title: 'Data Science Bootcamp', revenue: 3800 },
        { title: 'Machine Learning Masterclass', revenue: 2900 }
      ],
      coursesWithLowestCompletionRate: [
        { title: 'Advanced Algorithms', rate: 42 },
        { title: 'Blockchain Development', rate: 48 },
        { title: 'Quantum Computing Basics', rate: 52 }
      ],
      enrollmentsByMonth: [
        { month: 'Jan', count: 42 },
        { month: 'Fév', count: 38 },
        { month: 'Mar', count: 55 },
        { month: 'Avr', count: 48 },
        { month: 'Mai', count: 62 },
        { month: 'Juin', count: 75 }
      ],
      completionsByDifficulty: {
        beginner: 82,
        intermediate: 65,
        advanced: 48
      },
      averageTimeToComplete: 18,
      abandonmentRate: 22
    });
  } catch (error) {
    console.error('Error calculating course stats:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCategoryStats = async (req, res) => {
  try {
    // Get all categories
    const categories = await Category.find();

    // Get all modules with their categories
    const modules = await Module.find().populate('category');

    // Get all courses with their modules
    const courses = await Course.find().populate('module');

    const categoriesWithCourses = [];
    const categoriesWithUsers = [];

    // For each category, count courses and users
    for (const category of categories) {
      // Count modules in this category
      const categoryModules = modules.filter(module =>
        module.category && module.category._id.toString() === category._id.toString()
      );

      // Count courses in these modules
      let courseCount = 0;
      let userCount = 0;
      const uniqueUsers = new Set();

      for (const module of categoryModules) {
        const moduleCourses = courses.filter(course =>
          course.module && course.module._id.toString() === module._id.toString()
        );

        courseCount += moduleCourses.length;

        // Count unique users enrolled in courses of this category
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

    // Sort by number of courses in descending order
    categoriesWithCourses.sort((a, b) => b.courses - a.courses);

    // Sort by number of users in descending order
    categoriesWithUsers.sort((a, b) => b.users - a.users);

    // Calculate average courses per category
    const totalCourses = categoriesWithCourses.reduce((total, cat) => total + cat.courses, 0);
    const averageCoursesPerCategory = categories.length > 0 ? totalCourses / categories.length : 0;

    res.json({
      categoriesWithMostCourses: categoriesWithCourses.slice(0, 5),
      categoriesWithMostUsers: categoriesWithUsers.slice(0, 5),
      averageCoursesPerCategory,
      // Mock data for demonstration - would be replaced with real data in production
      categoryGrowthRate: [
        { name: 'Web Development', growth: 15 },
        { name: 'Data Science', growth: 28 },
        { name: 'Mobile Development', growth: 12 },
        { name: 'DevOps', growth: 32 }
      ],
      categoriesByRevenue: [
        { name: 'Web Development', revenue: 5800 },
        { name: 'Data Science', revenue: 4200 },
        { name: 'Mobile Development', revenue: 2500 }
      ],
      categoryCompletionRates: [
        { name: 'Web Development', rate: 72 },
        { name: 'Data Science', rate: 68 },
        { name: 'Mobile Development', rate: 65 }
      ],
      trendingCategories: [
        { name: 'AI & Machine Learning', growth: 45 },
        { name: 'Cloud Computing', growth: 38 },
        { name: 'Cybersecurity', growth: 32 }
      ],
      categoryEngagementByUserType: [
        { category: 'Web Development', beginners: 45, intermediate: 35, advanced: 20 },
        { category: 'Data Science', beginners: 30, intermediate: 45, advanced: 25 },
        { category: 'Mobile Development', beginners: 50, intermediate: 30, advanced: 20 }
      ]
    });
  } catch (error) {
    console.error('Error calculating category stats:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getQuizStats = async (req, res) => {
  try {
    // Get all quizzes
    const quizzes = await Quiz.find();

    // Get all quiz results
    const quizResults = await QuizResult.find().populate('quiz');

    // Calculate average score
    const totalScore = quizResults.reduce((total, result) => total + (result.percentage || 0), 0);
    const averageScore = quizResults.length > 0 ? Math.round(totalScore / quizResults.length) : 0;

    // Calculate average time per quiz
    const totalTime = quizResults.reduce((total, result) => total + (result.timeSpent || 0), 0);
    const averageTimePerQuiz = quizResults.length > 0 ? Math.round(totalTime / quizResults.length / 60) : 0; // Convert to minutes

    // Calculate completion rates by quiz
    const quizCompletionRates = {};
    const quizScores = {};

    for (const result of quizResults) {
      if (result.quiz) {
        const quizId = result.quiz._id.toString();

        // Count attempts for this quiz
        if (!quizCompletionRates[quizId]) {
          quizCompletionRates[quizId] = {
            title: result.quiz.title,
            attempts: 0,
            completions: 0
          };
        }

        quizCompletionRates[quizId].attempts++;

        // Consider as completed if score is >= 70%
        if (result.percentage >= 70) {
          quizCompletionRates[quizId].completions++;
        }

        // Calculate average score for this quiz
        if (!quizScores[quizId]) {
          quizScores[quizId] = {
            title: result.quiz.title,
            totalScore: 0,
            count: 0
          };
        }

        quizScores[quizId].totalScore += result.percentage || 0;
        quizScores[quizId].count++;
      }
    }

    // Calculate final completion rates
    const quizzesWithCompletionRates = Object.values(quizCompletionRates).map(quiz => ({
      title: quiz.title,
      completion: quiz.attempts > 0 ? Math.round((quiz.completions / quiz.attempts) * 100) : 0
    }));

    // Calculate final average scores
    const quizzesWithScores = Object.values(quizScores).map(quiz => ({
      title: quiz.title,
      score: quiz.count > 0 ? Math.round(quiz.totalScore / quiz.count) : 0
    }));

    // Sort by completion rate in descending order
    quizzesWithCompletionRates.sort((a, b) => b.completion - a.completion);

    // Sort by score in ascending order to find the lowest
    quizzesWithScores.sort((a, b) => a.score - b.score);

    res.json({
      averageScore,
      quizzesWithHighestCompletion: quizzesWithCompletionRates.slice(0, 5),
      quizzesWithLowestScores: quizzesWithScores.slice(0, 5),
      totalQuizAttempts: quizResults.length,
      averageTimePerQuiz,
      // Mock data for demonstration - would be replaced with real data in production
      quizDistributionByDifficulty: {
        easy: 35,
        medium: 42,
        hard: 23
      },
      mostMissedQuestions: [
        { question: 'Expliquer la complexité temporelle de l\'algorithme QuickSort', missRate: 78 },
        { question: 'Décrire le fonctionnement des Hooks dans React', missRate: 72 },
        { question: 'Expliquer le concept de normalisation dans les bases de données', missRate: 68 }
      ],
      quizCompletionByDevice: {
        desktop: 72,
        mobile: 58,
        tablet: 65
      },
      quizAttemptsByTimeOfDay: [
        { time: 'Matin (8h-12h)', percentage: 22 },
        { time: 'Après-midi (12h-18h)', percentage: 38 },
        { time: 'Soir (18h-22h)', percentage: 32 },
        { time: 'Nuit (22h-8h)', percentage: 8 }
      ],
      certificateIssuanceRate: 65,
      quizRetryRate: 28
    });
  } catch (error) {
    console.error('Error calculating quiz stats:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getPaymentStats = async (req, res) => {
  try {
    // Get all payments
    const payments = await Payment.find({ status: 'succeeded' }).populate('courseId');

    // Calculate total revenue
    const totalRevenue = payments.reduce((total, payment) => total + (payment.amount || 0), 0);

    // Calculate average order value
    const averageOrderValue = payments.length > 0 ? Math.round(totalRevenue / payments.length) : 0;

    // Group payments by course to find most profitable courses
    const courseRevenue = {};

    for (const payment of payments) {
      if (payment.courseId) {
        const courseId = payment.courseId._id.toString();

        if (!courseRevenue[courseId]) {
          courseRevenue[courseId] = {
            title: payment.courseId.title,
            revenue: 0
          };
        }

        courseRevenue[courseId].revenue += payment.amount || 0;
      }
    }

    // Convert to array and sort by revenue
    const coursesWithRevenue = Object.values(courseRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate refund rate
    const refundedPayments = await Payment.countDocuments({ status: 'refunded' });
    const totalPayments = await Payment.countDocuments();
    const refundRate = totalPayments > 0 ? (refundedPayments / totalPayments) * 100 : 0;

    // Group payments by month
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentPayments = await Payment.find({
      createdAt: { $gte: sixMonthsAgo },
      status: 'succeeded'
    });

    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const revenueByMonth = {};

    for (const payment of recentPayments) {
      const month = payment.createdAt.getMonth();
      const monthName = monthNames[month];

      if (!revenueByMonth[monthName]) {
        revenueByMonth[monthName] = 0;
      }

      revenueByMonth[monthName] += payment.amount || 0;
    }

    // Convert to array format
    const revenueByMonthArray = Object.entries(revenueByMonth).map(([month, amount]) => ({
      month,
      amount
    }));

    res.json({
      totalRevenue,
      averageOrderValue,
      mostProfitableCourses: coursesWithRevenue,
      refundRate,
      revenueByMonth: revenueByMonthArray,
      // Mock data for demonstration - would be replaced with real data in production
      paymentMethodDistribution: {
        creditCard: 72,
        paypal: 25,
        other: 3
      },
      revenueByCountry: [
        { country: 'France', amount: 5200 },
        { country: 'Tunisie', amount: 3800 },
        { country: 'Maroc', amount: 2100 },
        { country: 'Algérie', amount: 1400 }
      ],
      lifetimeValue: 210
    });
  } catch (error) {
    console.error('Error calculating payment stats:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getOverviewStats = async (req, res) => {
  try {
    // Get basic counts
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalCategories = await Category.countDocuments();
    const totalModules = await Module.countDocuments();
    const totalQuizzes = await Quiz.countDocuments();
    const totalCertificates = await Certificate.countDocuments();
    const totalEvents = await Event.countDocuments();

    // Calculate active users (users who logged in within the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } });

    // Calculate total revenue
    const payments = await Payment.find({ status: 'succeeded' });
    const totalRevenue = payments.reduce((total, payment) => total + (payment.amount || 0), 0);

    // Calculate user growth rate
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const usersLastMonth = await User.countDocuments({ createdAt: { $gte: oneMonthAgo } });
    const usersPreviousMonth = await User.countDocuments({
      createdAt: { $gte: twoMonthsAgo, $lt: oneMonthAgo }
    });

    const growthRate = usersPreviousMonth > 0
      ? Math.round(((usersLastMonth - usersPreviousMonth) / usersPreviousMonth) * 100)
      : usersLastMonth > 0 ? 100 : 0;

    res.json({
      totalUsers,
      totalCourses,
      totalCategories,
      totalModules,
      totalQuizzes,
      totalCertificates,
      totalEvents,
      totalRevenue,
      activeUsers,
      // Mock data for demonstration - would be replaced with real data in production
      conversionRate: 28,
      growthRate,
      averageSessionDuration: 22
    });
  } catch (error) {
    console.error('Error calculating overview stats:', error);
    res.status(500).json({ message: error.message });
  }
};