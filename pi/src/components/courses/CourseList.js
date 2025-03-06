import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import './CourseStyle.css';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { moduleId } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = Cookies.get('token');
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };

        const [courseRes, moduleRes] = await Promise.all([
          axios.get(`http://localhost:5001/api/courses/module/${moduleId}`, config),
          axios.get(`http://localhost:5001/api/modules/${moduleId}`, config)
        ]);

        if (courseRes.data && moduleRes.data) {
          setCourses(courseRes.data);
          setModule(moduleRes.data);
        } else {
          setError('No data found');
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError(error.response?.data?.message || 'Failed to load courses. Please try again later.');
        setLoading(false);
      }
    };

    if (moduleId) {
      fetchData();
    }
  }, [moduleId]);

  if (loading) {
    return (
      <div className="course-list-container">
        <div className="loading">Loading courses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-list-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="course-list-container">
      <div className="course-header">
        <h2>{module ? module.name : 'Courses'}</h2>
        <p>
          {module?.description || 'Discover our comprehensive collection of courses'}
        </p>
      </div>
      
      {courses.length === 0 ? (
        <div className="no-courses">
          <p>No courses available for this module yet.</p>
          <p>Check back soon for new content!</p>
        </div>
      ) : (
        <div className="course-grid">
          {courses.map(course => (
            <div key={course._id} className="course-card">
              <div className="course-card-content">
                <div className="course-info">
                  <h3>{course.name}</h3>
                  <p>{course.description}</p>
                </div>
                <div className="course-meta">
                  <div className="course-stats">
                    <span>
                      <i className="far fa-clock"></i>
                      {course.duration || '0h'}
                    </span>
                    <span>
                      <i className="far fa-star"></i>
                      {course.rating || '0.0'}
                    </span>
                    <span>
                      <i className="fas fa-users"></i>
                      {course.enrollments || 0} students
                    </span>
                  </div>
                  <div className="course-tags">
                    {course.tags && course.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {course.quiz && (
                  <div className="course-quiz">
                    <div className="quiz-info">
                      <i className="fas fa-question-circle"></i>
                      <span>Quiz Available</span>
                      <span>{course.quiz.questions?.length || 0} questions</span>
                      <span>{course.quiz.timeLimit} minutes</span>
                    </div>
                    <Link 
                      to={`/quiz/${course.quiz._id}`}
                      className="btn btn-quiz"
                    >
                      Take Quiz
                    </Link>
                  </div>
                )}
                <div className="course-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress" 
                      style={{ width: `${course.progress || 0}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {course.progress || 0}% Complete
                  </span>
                </div>
              </div>
              <div className="course-actions">
                <Link 
                  to={`/courses/${course._id}`}
                  className="btn btn-primary"
                >
                  Start Learning
                </Link>
                {course.certificate && (
                  <button className="btn btn-secondary">
                    <i className="fas fa-certificate"></i>
                    Certificate Available
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseList;
