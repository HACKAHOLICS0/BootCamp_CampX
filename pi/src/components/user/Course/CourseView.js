import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Row, Col, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import config from '../../../config';
import './CourseView.css';

const CourseView = () => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { categoryId, moduleId, courseId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching course:', courseId); // Debug log

        const response = await axios.get(`${config.API_URL}${config.endpoints.courses}/${courseId}`);
        console.log('Course response:', response.data); // Debug log

        if (!response.data) {
          throw new Error('No course data received');
        }

        // Get quizzes for this course
        const quizzesResponse = await axios.get(`${config.API_URL}${config.endpoints.quizzes}/course/${courseId}`);
        console.log('Quizzes response:', quizzesResponse.data); // Debug log

        // Format course data with quizzes
        const formattedCourse = {
          ...response.data,
          quizzes: quizzesResponse.data.map(quiz => ({
            _id: quiz._id,
            title: quiz.title,
            description: quiz.description,
            chronoVal: quiz.chronoVal,
            questionCount: quiz.questionCount || 0
          }))
        };

        setCourse(formattedCourse);
      } catch (err) {
        console.error('Error fetching course:', err);
        setError(
          err.response?.data?.error || 
          err.message || 
          'Failed to load course. Please try again later.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const handleStartQuiz = (quizId) => {
    navigate(`/categories/${categoryId}/modules/${moduleId}/courses/${courseId}/quiz/${quizId}`);
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Course</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex justify-content-end">
            <Button 
              variant="outline-danger"
              onClick={() => navigate(`/categories/${categoryId}/modules/${moduleId}`)}
            >
              Return to Module
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          <Alert.Heading>Course Not Found</Alert.Heading>
          <p>The requested course could not be found.</p>
          <div className="d-flex justify-content-end">
            <Button 
              variant="outline-warning"
              onClick={() => navigate(`/categories/${categoryId}/modules/${moduleId}`)}
            >
              Return to Module
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Card className="course-card">
        <Card.Header as="h2" className="text-center">{course.title}</Card.Header>
        <Card.Body>
          <Card.Text>{course.description}</Card.Text>

          {course.videoUrl && (
            <div className="video-container mb-4">
              <iframe
                src={course.videoUrl}
                title={course.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}

          <h3 className="mt-4 mb-3">Available Quizzes</h3>
          {course.quizzes && course.quizzes.length > 0 ? (
            <Row xs={1} md={2} lg={3} className="g-4">
              {course.quizzes.map((quiz) => (
                <Col key={quiz._id}>
                  <Card className="quiz-card h-100">
                    <Card.Body>
                      <Card.Title>{quiz.title || 'Untitled Quiz'}</Card.Title>
                      <Card.Text>{quiz.description || 'No description available'}</Card.Text>
                      <div className="quiz-info d-flex justify-content-between mb-3">
                        <span>Questions: {quiz.questionCount || 0}</span>
                        <span>Time: {quiz.chronoVal || 0} min</span>
                      </div>
                      <Button
                        variant="primary"
                        onClick={() => handleStartQuiz(quiz._id)}
                        className="mt-3 w-100"
                      >
                        Start Quiz
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Alert variant="info">No quizzes available for this course.</Alert>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CourseView;
