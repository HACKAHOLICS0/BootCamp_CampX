import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import Cookies from 'js-cookie';
import './CourseView.css';

const backendURL = "http://localhost:5001/api";

const CourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('content');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = Cookies.get('token');
        const response = await fetch(`${backendURL}/courses/${courseId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch course');
        }

        const data = await response.json();
        setCourse(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching course:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  if (loading) {
    return (
      <Container className="course-loading">
        <div className="spinner"></div>
        <p>Chargement du cours...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Card className="error-card">
          <Card.Body>
            <Card.Title className="text-danger">Erreur</Card.Title>
            <Card.Text>{error}</Card.Text>
            <Button variant="primary" onClick={() => navigate('/courses')}>
              Retourner à la liste des cours
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container>
        <Card className="error-card">
          <Card.Body>
            <Card.Title>Cours non trouvé</Card.Title>
            <Card.Text>Le cours que vous cherchez n'existe pas ou n'est pas accessible.</Card.Text>
            <Button variant="primary" onClick={() => navigate('/courses')}>
              Retourner à la liste des cours
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid className="course-container">
      <Container>
        <Row>
          <Col md={3}>
            <div className="course-sidebar">
              <h2 className="course-title">{course.title}</h2>
              <div className="nav-buttons">
                <Button
                  variant={activeTab === 'content' ? 'primary' : 'outline-primary'}
                  className="nav-button"
                  onClick={() => setActiveTab('content')}
                >
                  Contenu du cours
                </Button>
                {course.quiz && (
                  <Button
                    variant={activeTab === 'quiz' ? 'primary' : 'outline-primary'}
                    className="nav-button"
                    onClick={() => setActiveTab('quiz')}
                  >
                    Quiz
                  </Button>
                )}
              </div>
            </div>
          </Col>

          <Col md={9} className="course-main">
            {activeTab === 'content' ? (
              <>
                <Card className="content-card">
                  <Card.Body>
                    <Card.Title>Description du cours</Card.Title>
                    <div className="course-description">
                      {course.description}
                    </div>
                  </Card.Body>
                </Card>

                {course.videos && course.videos.length > 0 ? (
                  course.videos.map((video, index) => (
                    <div key={video._id || index} className="video-item">
                      <div className="video-container">
                        <iframe
                          src={video.url}
                          title={video.title}
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                      <h4>{video.title}</h4>
                      {video.description && <p>{video.description}</p>}
                    </div>
                  ))
                ) : (
                  <div className="no-content">
                    Aucune vidéo disponible pour ce cours.
                  </div>
                )}
              </>
            ) : (
              <Card className="quiz-info-card">
                <Card.Body>
                  {course.quiz ? (
                    <div className="quiz-details">
                      <h4>{course.quiz.title}</h4>
                      <p>Nombre de questions: {course.quiz.questions?.length || 0}</p>
                      {course.quiz.chronoVal && (
                        <p>Temps alloué: {course.quiz.chronoVal} minutes</p>
                      )}
                      <Button
                        variant="primary"
                        className="start-quiz-btn"
                        onClick={() => navigate(`/courses/${courseId}/quiz/${course.quiz._id}`)}
                      >
                        Commencer le Quiz
                      </Button>
                    </div>
                  ) : (
                    <div className="no-content">
                      Aucun quiz disponible pour ce cours.
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </Container>
  );
};

export default CourseView;
