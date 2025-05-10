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
