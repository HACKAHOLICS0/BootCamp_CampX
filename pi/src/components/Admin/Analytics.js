import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users, Book, FolderTree, Layers, Activity,
  DollarSign, Award, Clock, BarChart2, PieChart,
  CheckCircle, AlertTriangle, Calendar, BookOpen
} from 'lucide-react';
import './AdminStyle.css';
import './styles/DashboardStyle.css';

// Card component for displaying stats
const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="dashboard-card" style={{ borderColor: color }}>
    <div className="card-icon" style={{ backgroundColor: color }}>
      <Icon size={24} color="white" />
    </div>
    <div className="card-content">
      <h3>{title}</h3>
      <p className="value">{value}</p>
      {subtitle && <p className="subtitle">{subtitle}</p>}
    </div>
  </div>
);

// Tab component for switching between different analytics views
const AnalyticsTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'courses', label: 'Courses', icon: Book },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'quizzes', label: 'Quizzes', icon: BookOpen },
    { id: 'payments', label: 'Payments', icon: DollarSign }
  ];

  return (
    <div className="analytics-tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          <tab.icon size={18} />
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    overview: {
      totalUsers: 0,
      totalCourses: 0,
      totalCategories: 0,
      totalModules: 0,
      totalQuizzes: 0,
      totalRevenue: 0,
      totalCertificates: 0,
      totalEvents: 0,
      activeUsers: 0,
      conversionRate: 0,
      growthRate: 0,
      averageSessionDuration: 0
    },
    users: {
      totalUsers: 0,
      verifiedUsers: 0,
      unverifiedUsers: 0,
      googleUsers: 0,
      githubUsers: 0,
      localUsers: 0,
      averageCoursesPerUser: 0,
      mostActiveUsers: [],
      usersByCountry: [],
      userRetentionRate: 0,
      newUsersThisMonth: 0,
      userGrowthByMonth: [],
      averageSessionsPerUser: 0,
      deviceDistribution: {
        desktop: 0,
        mobile: 0,
        tablet: 0
      },
      userEngagementByTime: []
    },
    courses: {
      totalCourses: 0,
      totalEnrollments: 0,
      averagePrice: 0,
      mostPopularCourses: [],
      coursesByCategory: [],
      averageCompletionRate: 0,
      totalDuration: 0,
      coursesWithHighestRevenue: [],
      coursesWithLowestCompletionRate: [],
      averageRating: 0,
      enrollmentsByMonth: [],
      completionsByDifficulty: {
        beginner: 0,
        intermediate: 0,
        advanced: 0
      },
      averageTimeToComplete: 0,
      abandonmentRate: 0
    },
    categories: {
      totalCategories: 0,
      categoriesWithMostCourses: [],
      categoriesWithMostUsers: [],
      averageCoursesPerCategory: 0,
      categoryGrowthRate: [],
      categoriesByRevenue: [],
      categoryCompletionRates: [],
      trendingCategories: [],
      categoryEngagementByUserType: []
    },
    quizzes: {
      totalQuizzes: 0,
      averageScore: 0,
      quizzesWithHighestCompletion: [],
      quizzesWithLowestScores: [],
      totalQuizAttempts: 0,
      averageTimePerQuiz: 0,
      quizDistributionByDifficulty: {
        easy: 0,
        medium: 0,
        hard: 0
      },
      mostMissedQuestions: [],
      quizCompletionByDevice: {
        desktop: 0,
        mobile: 0,
        tablet: 0
      },
      quizAttemptsByTimeOfDay: [],
      certificateIssuanceRate: 0,
      quizRetryRate: 0
    },
    payments: {
      totalRevenue: 0,
      revenueByMonth: [],
      averageOrderValue: 0,
      mostProfitableCourses: [],
      paymentMethodDistribution: {
        creditCard: 0,
        paypal: 0,
        other: 0
      },
      refundRate: 0,
      revenueByCountry: [],
      lifetimeValue: 0
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Use localhost URL for development
        const baseURL = 'http://localhost:5003';

        // Fetch all statistics in parallel
        const [
          overviewResponse,
          usersResponse,
          coursesResponse,
          categoriesResponse,
          quizzesResponse,
          paymentsResponse
        ] = await Promise.all([
          axios.get(`${baseURL}/api/analytics/overview`).catch(() => ({
            data: {
              totalUsers: 0,
              totalCourses: 0,
              totalCategories: 0,
              totalModules: 0,
              totalQuizzes: 0,
              totalCertificates: 0,
              totalEvents: 0,
              totalRevenue: 0,
              activeUsers: 0,
              conversionRate: 0,
              growthRate: 0,
              averageSessionDuration: 0
            }
          })),
          axios.get(`${baseURL}/api/analytics/users/stats`).catch(() => ({
            data: {
              verifiedUsers: 0,
              unverifiedUsers: 0,
              googleUsers: 0,
              githubUsers: 0,
              localUsers: 0,
              averageCoursesPerUser: 0,
              mostActiveUsers: [],
              usersByCountry: [],
              userRetentionRate: 0,
              newUsersThisMonth: 0,
              userGrowthByMonth: [],
              averageSessionsPerUser: 0,
              deviceDistribution: { desktop: 0, mobile: 0, tablet: 0 },
              userEngagementByTime: []
            }
          })),
          axios.get(`${baseURL}/api/analytics/courses/stats`).catch(() => ({
            data: {
              totalEnrollments: 0,
              averagePrice: 0,
              averageRating: 0,
              mostPopularCourses: [],
              coursesByCategory: [],
              averageCompletionRate: 0,
              totalDuration: 0,
              coursesWithHighestRevenue: [],
              coursesWithLowestCompletionRate: [],
              enrollmentsByMonth: [],
              completionsByDifficulty: { beginner: 0, intermediate: 0, advanced: 0 },
              averageTimeToComplete: 0,
              abandonmentRate: 0
            }
          })),
          axios.get(`${baseURL}/api/analytics/categories/stats`).catch(() => ({
            data: {
              categoriesWithMostCourses: [],
              categoriesWithMostUsers: [],
              averageCoursesPerCategory: 0,
              categoryGrowthRate: [],
              categoriesByRevenue: [],
              categoryCompletionRates: [],
              trendingCategories: [],
              categoryEngagementByUserType: []
            }
          })),
          axios.get(`${baseURL}/api/analytics/quizzes/stats`).catch(() => ({
            data: {
              averageScore: 0,
              quizzesWithHighestCompletion: [],
              quizzesWithLowestScores: [],
              totalQuizAttempts: 0,
              averageTimePerQuiz: 0,
              quizDistributionByDifficulty: { easy: 0, medium: 0, hard: 0 },
              mostMissedQuestions: [],
              quizCompletionByDevice: { desktop: 0, mobile: 0, tablet: 0 },
              quizAttemptsByTimeOfDay: [],
              certificateIssuanceRate: 0,
              quizRetryRate: 0
            }
          })),
          axios.get(`${baseURL}/api/analytics/payments/stats`).catch(() => ({
            data: {
              totalRevenue: 0,
              averageOrderValue: 0,
              mostProfitableCourses: [],
              refundRate: 0,
              revenueByMonth: [],
              paymentMethodDistribution: { creditCard: 0, paypal: 0, other: 0 },
              revenueByCountry: [],
              lifetimeValue: 0
            }
          }))
        ]);

        // Combine all data into a single object
        const combinedStats = {
          overview: overviewResponse.data,
          users: {
            totalUsers: overviewResponse.data.totalUsers,
            ...usersResponse.data
          },
          courses: {
            totalCourses: overviewResponse.data.totalCourses,
            ...coursesResponse.data
          },
          categories: {
            totalCategories: overviewResponse.data.totalCategories,
            ...categoriesResponse.data
          },
          quizzes: {
            totalQuizzes: overviewResponse.data.totalQuizzes,
            ...quizzesResponse.data
          },
          payments: {
            totalRevenue: overviewResponse.data.totalRevenue,
            ...paymentsResponse.data
          }
        };

        setStats(combinedStats);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        // If API endpoints don't exist yet, we'll use mock data
        setMockData();
      } finally {
        setLoading(false);
      }
    };

    const setMockData = () => {
      // Initialize with empty data
      setStats({
        overview: {
          totalUsers: 120,
          totalCourses: 45,
          totalCategories: 8,
          totalModules: 22,
          totalQuizzes: 67,
          totalRevenue: 12500,
          totalCertificates: 89,
          totalEvents: 15,
          activeUsers: 85,
          growthRate: 15
        },
        users: {
          totalUsers: 120,
          verifiedUsers: 98,
          unverifiedUsers: 22,
          googleUsers: 45,
          githubUsers: 30,
          localUsers: 45,
          averageCoursesPerUser: 2.3,
          mostActiveUsers: [
            { name: 'John Doe', courses: 8, quizzes: 15 },
            { name: 'Jane Smith', courses: 7, quizzes: 12 },
            { name: 'Robert Johnson', courses: 6, quizzes: 10 }
          ],
          userRetentionRate: 78,
          newUsersThisMonth: 24
        },
        courses: {
          totalCourses: 45,
          totalEnrollments: 350,
          averagePrice: 49.99,
          mostPopularCourses: [
            { title: 'JavaScript Fundamentals', enrollments: 45 },
            { title: 'React for Beginners', enrollments: 38 },
            { title: 'Python Masterclass', enrollments: 32 }
          ],
          coursesByCategory: [
            { category: 'Web Development', count: 18 },
            { category: 'Data Science', count: 12 },
            { category: 'Mobile Development', count: 8 }
          ],
          averageRating: 4.2
        },
        categories: {
          totalCategories: 8,
          categoriesWithMostCourses: [
            { name: 'Web Development', courses: 18 },
            { name: 'Data Science', courses: 12 },
            { name: 'Mobile Development', courses: 8 }
          ],
          categoriesWithMostUsers: [
            { name: 'Web Development', users: 85 },
            { name: 'Data Science', users: 65 },
            { name: 'Mobile Development', users: 40 }
          ],
          averageCoursesPerCategory: 5.6,
          categoriesByRevenue: [
            { name: 'Web Development', revenue: 5800 },
            { name: 'Data Science', revenue: 4200 },
            { name: 'Mobile Development', revenue: 2500 }
          ]
        },
        quizzes: {
          totalQuizzes: 67,
          averageScore: 72,
          quizzesWithHighestCompletion: [
            { title: 'HTML Basics', completion: 95 },
            { title: 'CSS Fundamentals', completion: 92 },
            { title: 'JavaScript Variables', completion: 88 }
          ],
          quizzesWithLowestScores: [
            { title: 'Advanced Algorithms', score: 58 },
            { title: 'React Hooks Deep Dive', score: 62 },
            { title: 'Database Optimization', score: 65 }
          ],
          totalQuizAttempts: 890,
          averageTimePerQuiz: 18
        },
        payments: {
          totalRevenue: 12500,
          revenueByMonth: [
            { month: 'Jan', amount: 1800 },
            { month: 'Fév', amount: 1650 },
            { month: 'Mar', amount: 2200 },
            { month: 'Avr', amount: 1950 },
            { month: 'Mai', amount: 2400 },
            { month: 'Juin', amount: 2500 }
          ],
          averageOrderValue: 85,
          mostProfitableCourses: [
            { title: 'Full Stack Web Development', revenue: 4500 },
            { title: 'Data Science Bootcamp', revenue: 3800 },
            { title: 'Machine Learning Masterclass', revenue: 2900 }
          ],
          refundRate: 3.5
        }
      });
    };

    fetchData();
  }, []);

  // Render different content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'users':
        return renderUsersTab();
      case 'courses':
        return renderCoursesTab();
      case 'categories':
        return renderCategoriesTab();
      case 'quizzes':
        return renderQuizzesTab();
      case 'payments':
        return renderPaymentsTab();
      default:
        return renderOverviewTab();
    }
  };

  // Overview tab content
  const renderOverviewTab = () => (
    <>
      <div className="dashboard-grid">
        <StatCard
          title="Utilisateurs"
          value={stats.overview.totalUsers}
          icon={Users}
          color="#4CAF50"
        />
        <StatCard
          title="Cours"
          value={stats.overview.totalCourses}
          icon={Book}
          color="#E91E63"
        />
        <StatCard
          title="Catégories"
          value={stats.overview.totalCategories}
          icon={FolderTree}
          color="#2196F3"
        />
        <StatCard
          title="Modules"
          value={stats.overview.totalModules}
          icon={Layers}
          color="#FF9800"
        />
      </div>

      <div className="dashboard-grid">
        <StatCard
          title="Quiz"
          value={stats.overview.totalQuizzes}
          icon={BookOpen}
          color="#9C27B0"
        />
        <StatCard
          title="Revenus"
          value={`${stats.overview.totalRevenue} €`}
          icon={DollarSign}
          color="#00BCD4"
        />
        <StatCard
          title="Certificats"
          value={stats.overview.totalCertificates}
          icon={Award}
          color="#795548"
        />
        <StatCard
          title="Événements"
          value={stats.overview.totalEvents}
          icon={Calendar}
          color="#607D8B"
        />
      </div>

      <div className="dashboard-grid">
        <StatCard
          title="Utilisateurs Actifs"
          value={stats.overview.activeUsers}
          icon={Activity}
          color="#3F51B5"
          subtitle={`${stats.overview.activeUsers && stats.overview.totalUsers ? Math.round((stats.overview.activeUsers / stats.overview.totalUsers) * 100) : 0}% du total`}
        />
        <StatCard
          title="Taux de Croissance"
          value={`${stats.overview.growthRate || 0}%`}
          icon={BarChart2}
          color="#FF5722"
        />
      </div>

      <div className="analytics-section">
        <h3>Statistiques Globales</h3>
        <p>Vue d'ensemble des performances de la plateforme. Utilisez les onglets ci-dessus pour des analyses détaillées par catégorie.</p>

        <div className="analytics-highlights">
          <div className="highlight-item">
            <h4>Score Moyen des Quiz</h4>
            <p className="highlight-value">{stats.quizzes.averageScore || 0}%</p>
          </div>
          <div className="highlight-item">
            <h4>Taux de Rétention des Utilisateurs</h4>
            <p className="highlight-value">{stats.users.userRetentionRate || 0}%</p>
          </div>
          <div className="highlight-item">
            <h4>Nouveaux Utilisateurs ce Mois</h4>
            <p className="highlight-value">{stats.users.newUsersThisMonth || 0}</p>
          </div>
        </div>
      </div>
    </>
  );

  // Users tab content
  const renderUsersTab = () => (
    <>
      <div className="dashboard-grid">
        <StatCard
          title="Total Utilisateurs"
          value={stats.users.totalUsers}
          icon={Users}
          color="#4CAF50"
        />
        <StatCard
          title="Utilisateurs Vérifiés"
          value={stats.users.verifiedUsers}
          icon={CheckCircle}
          color="#2196F3"
          subtitle={`${Math.round((stats.users.verifiedUsers / stats.users.totalUsers) * 100)}%`}
        />
        <StatCard
          title="Utilisateurs Non Vérifiés"
          value={stats.users.unverifiedUsers}
          icon={AlertTriangle}
          color="#FF9800"
          subtitle={`${Math.round((stats.users.unverifiedUsers / stats.users.totalUsers) * 100)}%`}
        />
        <StatCard
          title="Nouveaux ce Mois"
          value={stats.users.newUsersThisMonth}
          icon={Users}
          color="#E91E63"
        />
      </div>

      <div className="dashboard-grid">
        <StatCard
          title="Utilisateurs Google"
          value={stats.users.googleUsers}
          icon={Users}
          color="#DB4437"
          subtitle={`${Math.round((stats.users.googleUsers / stats.users.totalUsers) * 100)}%`}
        />
        <StatCard
          title="Utilisateurs GitHub"
          value={stats.users.githubUsers}
          icon={Users}
          color="#333"
          subtitle={`${Math.round((stats.users.githubUsers / stats.users.totalUsers) * 100)}%`}
        />
        <StatCard
          title="Utilisateurs Email"
          value={stats.users.localUsers}
          icon={Users}
          color="#9C27B0"
          subtitle={`${Math.round((stats.users.localUsers / stats.users.totalUsers) * 100)}%`}
        />
        <StatCard
          title="Taux de Rétention"
          value={`${stats.users.userRetentionRate}%`}
          icon={Activity}
          color="#009688"
        />
      </div>

      <div className="analytics-section">
        <h3>Utilisateurs les Plus Actifs</h3>
        <div className="analytics-table-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Cours Suivis</th>
                <th>Quiz Complétés</th>
              </tr>
            </thead>
            <tbody>
              {stats.users.mostActiveUsers && stats.users.mostActiveUsers.map((user, index) => (
                <tr key={index}>
                  <td>{user.name}</td>
                  <td>{user.courses}</td>
                  <td>{user.quizzes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="analytics-section">
        <h3>Statistiques d'Engagement</h3>
        <div className="engagement-stats">
          <div className="engagement-item">
            <h4>Moyenne de Cours par Utilisateur</h4>
            <p>{stats.users.averageCoursesPerUser ? stats.users.averageCoursesPerUser.toFixed(1) : '0.0'}</p>
          </div>
        </div>
      </div>
    </>
  );

  // Courses tab content
  const renderCoursesTab = () => (
    <>
      <div className="dashboard-grid">
        <StatCard
          title="Total Cours"
          value={stats.courses.totalCourses}
          icon={Book}
          color="#E91E63"
        />
        <StatCard
          title="Inscriptions Totales"
          value={stats.courses.totalEnrollments}
          icon={Users}
          color="#4CAF50"
        />
        <StatCard
          title="Prix Moyen"
          value={`${stats.courses.averagePrice ? stats.courses.averagePrice.toFixed(2) : '0.00'} €`}
          icon={DollarSign}
          color="#00BCD4"
        />
        <StatCard
          title="Note Moyenne"
          value={stats.courses.averageRating ? stats.courses.averageRating.toFixed(1) : '0.0'}
          icon={Award}
          color="#FFC107"
          subtitle="sur 5"
        />
      </div>

      <div className="analytics-section">
        <h3>Cours les Plus Populaires</h3>
        <div className="analytics-table-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Cours</th>
                <th>Inscriptions</th>
              </tr>
            </thead>
            <tbody>
              {stats.courses.mostPopularCourses && stats.courses.mostPopularCourses.map((course, index) => (
                <tr key={index}>
                  <td>{course.title}</td>
                  <td>{course.enrollments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="analytics-section">
        <h3>Cours par Catégorie</h3>
        <div className="analytics-table-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Nombre de Cours</th>
              </tr>
            </thead>
            <tbody>
              {stats.courses.coursesByCategory && stats.courses.coursesByCategory.map((category, index) => (
                <tr key={index}>
                  <td>{category.category}</td>
                  <td>{category.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  // Categories tab content
  const renderCategoriesTab = () => (
    <>
      <div className="dashboard-grid">
        <StatCard
          title="Total Catégories"
          value={stats.categories.totalCategories}
          icon={FolderTree}
          color="#2196F3"
        />
        <StatCard
          title="Cours par Catégorie"
          value={stats.categories.averageCoursesPerCategory ? stats.categories.averageCoursesPerCategory.toFixed(1) : '0.0'}
          icon={Book}
          color="#E91E63"
        />
      </div>

      <div className="analytics-section">
        <h3>Catégories avec le Plus de Cours</h3>
        <div className="analytics-table-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Nombre de Cours</th>
              </tr>
            </thead>
            <tbody>
              {stats.categories.categoriesWithMostCourses && stats.categories.categoriesWithMostCourses.map((category, index) => (
                <tr key={index}>
                  <td>{category.name}</td>
                  <td>{category.courses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="analytics-section">
        <h3>Catégories les Plus Populaires</h3>
        <div className="analytics-table-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Nombre d'Utilisateurs</th>
              </tr>
            </thead>
            <tbody>
              {stats.categories.categoriesWithMostUsers && stats.categories.categoriesWithMostUsers.map((category, index) => (
                <tr key={index}>
                  <td>{category.name}</td>
                  <td>{category.users}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="analytics-section">
        <h3>Catégories avec le Plus de Revenus</h3>
        <div className="analytics-table-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Revenus</th>
              </tr>
            </thead>
            <tbody>
              {/* This section is now dynamic and will be populated from backend data */}
              {stats.categories.categoriesByRevenue && stats.categories.categoriesByRevenue.map((category, index) => (
                <tr key={index}>
                  <td>{category.name}</td>
                  <td>{category.revenue} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  // Quizzes tab content
  const renderQuizzesTab = () => (
    <>
      <div className="dashboard-grid">
        <StatCard
          title="Total Quiz"
          value={stats.quizzes.totalQuizzes}
          icon={BookOpen}
          color="#9C27B0"
        />
        <StatCard
          title="Score Moyen"
          value={`${stats.quizzes.averageScore}%`}
          icon={Award}
          color="#4CAF50"
        />
        <StatCard
          title="Tentatives Totales"
          value={stats.quizzes.totalQuizAttempts}
          icon={Activity}
          color="#FF9800"
        />
        <StatCard
          title="Temps Moyen par Quiz"
          value={`${stats.quizzes.averageTimePerQuiz} min`}
          icon={Clock}
          color="#00BCD4"
        />
      </div>

      <div className="analytics-section">
        <h3>Quiz avec le Taux de Complétion le Plus Élevé</h3>
        <div className="analytics-table-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Quiz</th>
                <th>Taux de Complétion</th>
              </tr>
            </thead>
            <tbody>
              {stats.quizzes.quizzesWithHighestCompletion && stats.quizzes.quizzesWithHighestCompletion.map((quiz, index) => (
                <tr key={index}>
                  <td>{quiz.title}</td>
                  <td>{quiz.completion}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="analytics-section">
        <h3>Quiz avec les Scores les Plus Bas</h3>
        <div className="analytics-table-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Quiz</th>
                <th>Score Moyen</th>
              </tr>
            </thead>
            <tbody>
              {stats.quizzes.quizzesWithLowestScores && stats.quizzes.quizzesWithLowestScores.map((quiz, index) => (
                <tr key={index}>
                  <td>{quiz.title}</td>
                  <td>{quiz.score}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  // Payments tab content
  const renderPaymentsTab = () => (
    <>
      <div className="dashboard-grid">
        <StatCard
          title="Revenus Totaux"
          value={`${stats.payments.totalRevenue || 0} €`}
          icon={DollarSign}
          color="#00BCD4"
        />
        <StatCard
          title="Valeur Moyenne Commande"
          value={`${stats.payments.averageOrderValue || 0} €`}
          icon={DollarSign}
          color="#4CAF50"
        />
        <StatCard
          title="Taux de Remboursement"
          value={`${stats.payments.refundRate || 0}%`}
          icon={AlertTriangle}
          color="#F44336"
        />

      </div>

      <div className="analytics-section">
        <h3>Revenus par Mois</h3>
        <div className="analytics-table-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Mois</th>
                <th>Revenus</th>
              </tr>
            </thead>
            <tbody>
              {stats.payments.revenueByMonth && stats.payments.revenueByMonth.map((month, index) => (
                <tr key={index}>
                  <td>{month.month}</td>
                  <td>{month.amount} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="analytics-section">
        <h3>Cours les Plus Rentables</h3>
        <div className="analytics-table-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Cours</th>
                <th>Revenus</th>
              </tr>
            </thead>
            <tbody>
              {stats.payments.mostProfitableCourses && stats.payments.mostProfitableCourses.map((course, index) => (
                <tr key={index}>
                  <td>{course.title}</td>
                  <td>{course.revenue} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  return (
    <div className="content-section">
      <div className="dashboard-header">
        <h2>Tableau de Bord Analytique</h2>
        <p>Statistiques détaillées et analyses de performance</p>
      </div>

      <AnalyticsTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des données...</p>
        </div>
      ) : (
        renderTabContent()
      )}
    </div>
  );
};

export default Analytics;
