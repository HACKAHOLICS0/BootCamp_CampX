import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import { FaUsers, FaClock, FaBook, FaGraduationCap, FaStar, FaChartLine, FaShoppingCart } from 'react-icons/fa';
import Cookies from 'js-cookie';
import PaymentForm from './PaymentForm';
import RecommendedVideos from './RecommendedVideos';
import './CourseStyle.css';

const backendURL = "http://localhost:5000/api";

const CourseList = () => {
  const { categoryId, moduleId } = useParams();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [userEnrolledCourses, setUserEnrolledCourses] = useState([]);

  useEffect(() => {
    fetchData();
    fetchUserEnrolledCourses();
  }, [moduleId]);

  const fetchUserEnrolledCourses = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) return;

      const response = await fetch(`${backendURL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUserEnrolledCourses(userData.enrolledCourses.map(course => course.courseId));
      }
    } catch (error) {
      console.error('Failed to fetch user courses:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = Cookies.get('token');

      if (!token) {
        throw new Error('Authentication required');
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      };

      const [coursesRes, moduleRes] = await Promise.all([
        fetch(`${backendURL}/courses/module/${moduleId}`, config),
        fetch(`${backendURL}/modules/${moduleId}`, config)
      ]);

      if (!coursesRes.ok || !moduleRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [coursesData, moduleData] = await Promise.all([
        coursesRes.json(),
        moduleRes.json()
      ]);

      setCourses(coursesData);
      setModule(moduleData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError(error.message || 'Failed to load courses');
      setLoading(false);
    }
  };

  const handlePurchaseClick = (course) => {
    setSelectedCourse(course);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    fetchUserEnrolledCourses(); // Refresh enrolled courses
    navigateToCourse(selectedCourse._id);
  };

  const navigateToCourse = (courseId) => {
    navigate(`/categories/${categoryId}/modules/${moduleId}/courses/${courseId}`);
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="course-header">
        <h2>{module?.name || 'Cours disponibles'}</h2>
        <p className="text-muted">
          {module?.description || 'Découvrez nos cours interactifs et enrichissants'}
        </p>
      </div>

      {courses.length === 0 ? (
        <Alert variant="info">
          <p className="mb-0">Aucun cours n'est disponible pour ce module.</p>
          <p className="mb-0">Revenez bientôt pour découvrir notre nouveau contenu !</p>
        </Alert>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {courses.map(course => {
            const isEnrolled = userEnrolledCourses.includes(course._id);

            return (
              <Col key={course._id}>
                <Card className="course-card">
                  <Card.Body>
                    <Card.Title>{course.title}</Card.Title>
                    <Card.Text>{course.description}</Card.Text>

                    <div className="course-meta">
                      <div className="course-stats-grid">
                        <div className="stat-item">
                          <div className="stat-icon">
                            <FaUsers />
                          </div>
                          <div className="stat-info">
                            <span className="stat-label">Participants</span>
                            <span className="stat-value">{course.purchasedBy?.length || 0}</span>
                          </div>
                        </div>

                        <div className="stat-item">
                          <div className="stat-icon">
                            <FaClock />
                          </div>
                          <div className="stat-info">
                            <span className="stat-label">Durée</span>
                            <span className="stat-value">{course.duration}h</span>
                          </div>
                        </div>

                        <div className="stat-item">
                          <div className="stat-icon">
                            <FaBook />
                          </div>
                          <div className="stat-info">
                            <span className="stat-label">Quiz</span>
                            <span className="stat-value">{course.quizzes?.length || 0}</span>
                          </div>
                        </div>

                        <div className="stat-item">
                          <div className="stat-icon">
                            <FaChartLine />
                          </div>
                          <div className="stat-info">
                            <span className="stat-label">Niveau</span>
                            <span className="stat-value">Intermédiaire</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="course-tags">
                      {course.quizzes?.length > 0 && (
                        <span className="course-tag">
                          <FaGraduationCap className="me-1" />
                          {course.quizzes.length} Quiz
                        </span>
                      )}
                      <span className="course-tag">
                        <FaStar className="me-1" />
                        Certifiant
                      </span>
                    </div>
                  </Card.Body>

                  <div className="course-footer">
                    <div className="course-price">
                      {course.price} DT
                    </div>
                    {isEnrolled ? (
                      <Button
                        variant="success"
                        onClick={() => navigateToCourse(course._id)}
                      >
                        <FaBook className="me-2" />
                        Accéder au cours
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={() => handlePurchaseClick(course)}
                      >
                        Acheter
                      </Button>
                    )}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Paiement du cours</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCourse && (
            <div className="payment-course-info">
              <h4>{selectedCourse.title}</h4>
              <p className="text-muted">{selectedCourse.description}</p>
              <PaymentForm
                courseId={selectedCourse._id}
                amount={selectedCourse.price}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setShowPaymentModal(false)}
              />
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Section des vidéos recommandées */}
      <div className="recommended-videos-section mt-5">
        <RecommendedVideos
          category={module?.name}
          limit={3}
        />
      </div>
    </Container>
  );
};

export default CourseList;