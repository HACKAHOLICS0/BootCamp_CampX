import React, { useState, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { 
  Users, BookOpen, Award, Star, 
  Brain, Target, Zap, TrendingUp,
  Clock, CheckCircle, UserCheck, Bookmark
} from 'lucide-react';
import axios from 'axios';
import './styles/Analytics.css';

const AnimatedNumber = ({ n }) => {
  const { number } = useSpring({
    from: { number: 0 },
    number: n,
    delay: 200,
    config: { mass: 1, tension: 20, friction: 10 }
  });

  return <animated.span>{number.to(n => n.toFixed(0))}</animated.span>;
};

const Analytics = () => {
  const [courseStats, setCourseStats] = useState([]);
  const [moduleStats, setModuleStats] = useState([]);
  const [quizStats, setQuizStats] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [quizTitle, setQuizTitle] = useState("");
  const [categoryTitle, setCategoryTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod] = useState('month');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, moduleRes, quizRes, categoryRes] = await Promise.all([
          axios.get('http://localhost:5001/api/statistics/courses'),
          axios.get('http://localhost:5001/api/statistics/modules'),
          axios.get('http://localhost:5001/api/statistics/quizzes'),
          axios.get('http://localhost:5001/api/statistics/categories')
        ]);

        setCourseStats(courseRes.data.courses || []);
        setCourseTitle(courseRes.data.title || "Courses Overview"); // Set title for course statistics

        setModuleStats(moduleRes.data.modules || []);
        setModuleTitle(moduleRes.data.title || "Module Performance"); // Set title for module statistics

        setQuizStats(quizRes.data.quizzes || []);
        setQuizTitle(quizRes.data.title || "Quiz Performance"); // Set title for quiz statistics

        setCategoryStats(categoryRes.data.categories || []);
        setCategoryTitle(categoryRes.data.title || "Category Performance"); // Set title for category statistics

      } catch (err) {
        setError('Error fetching data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="loading">Loading analytics data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const totalStudents = courseStats.reduce((acc, curr) => acc + (curr.enrolledStudentsCount || 0), 0);

  const stats = {
    totalStudents: totalStudents,
    totalRevenue: courseStats.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0),
    completionRate: totalStudents > 0
      ? Math.round(
          (courseStats.reduce((acc, curr) => acc + (curr.completionCount || 0), 0) / totalStudents) * 100
        )
      : 0,
    averageRating: (
      moduleStats.reduce((acc, curr) => acc + (curr.averageRating || 0), 0) / 
      (moduleStats.length || 1)
    ).toFixed(1),
    totalQuizAttempts: quizStats.reduce((acc, curr) => acc + (curr.attemptCount || 0), 0),
    totalQuizzesPassed: quizStats.reduce((acc, curr) => acc + (curr.passRate || 0), 0),
    totalCategories: categoryStats.length,
    totalCategoryStudents: categoryStats.reduce((acc, curr) => acc + (curr.totalStudents || 0), 0),
  };

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h1>{courseTitle}</h1> {/* Dynamically display the course title */}
        <div className="period-selector">
          <span className={selectedPeriod === 'month' ? 'active' : ''}>This Month</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card glow">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Students</h3>
            <div className="stat-value">
              <AnimatedNumber n={stats.totalStudents} />
            </div>
            <div className="stat-change positive">
              <TrendingUp size={16} />
              +12.5%
            </div>
          </div>
        </div>

        <div className="stat-card glow">
          <div className="stat-icon">
            <Zap size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <div className="stat-value">
              $<AnimatedNumber n={stats.totalRevenue} />
            </div>
            <div className="stat-change positive">
              <TrendingUp size={16} />
              +8.7%
            </div>
          </div>
        </div>

        <div className="stat-card glow">
          <div className="stat-icon">
            <Award size={24} />
          </div>
          <div className="stat-content">
            <h3>Completion Rate</h3>
            <div className="stat-value">
              <AnimatedNumber n={stats.completionRate} />%
            </div>
            <div className="stat-change positive">
              <TrendingUp size={16} />
              +15.3%
            </div>
          </div>
        </div>

        <div className="stat-card glow">
          <div className="stat-icon">
            <Star size={24} />
          </div>
          <div className="stat-content">
            <h3>Average Rating</h3>
            <div className="stat-value">
              {stats.averageRating}
            </div>
            <div className="stat-change positive">
              <TrendingUp size={16} />
              +4.2%
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card performance-metrics">
          <h3>{moduleTitle}</h3> {/* Dynamically display the module title */}
          <div className="metrics-grid">
            {moduleStats.slice(0, 4).map((module, index) => (
              <div key={index} className="metric-item">
                <div className="metric-circle">
                  <svg viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="var(--progress-track)"
                      strokeWidth="2"
                    />
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="var(--progress-fill)"
                      strokeWidth="2"
                      strokeDasharray={`${module.completionCount || 0}, 100`}
                    />
                  </svg>
                  <div className="metric-value">{module.completionCount || 0}%</div>
                </div>
                <div className="metric-label">{module.title}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-card category-stats">
          <h3>{categoryTitle}</h3> {/* Dynamically display the category title */}
          <div className="category-list">
            {categoryStats.map((category, index) => (
              <div key={index} className="category-item">
                <div className="category-header">
                  <span>{category.name}</span>
                  <span className="category-students">
                    <UserCheck size={16} />
                    {category.totalStudents}
                  </span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${category.completionCount || 0}%` }}
                  />
                </div>
                <div className="category-footer">
                  <span>{category.completionCount || 0}% completed</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-card quiz-performance">
          <h3>{quizTitle}</h3> {/* Dynamically display the quiz title */}
          <div className="quiz-list">
            {quizStats.map((quiz, index) => (
              <div key={index} className="quiz-item">
                <div className="quiz-header">
                  <span>{quiz.title}</span>
                  <span className="quiz-score">
                    {quiz.averageScore}/100
                  </span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${quiz.passRate}%` }}
                  />
                </div>
                <div className="quiz-footer">
                  <span>Pass Rate: {quiz.passRate}%</span>
                  <span className="attempts">{quiz.attemptCount} attempts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
