import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import Cookies from 'js-cookie';


const backendURL = "http://localhost:5001/api";

const CourseList = () => {
  const { categoryId, moduleId } = useParams();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [moduleId]);

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
      <div className="course-header mb-4">
        <h2>{module?.name || 'Cours'}</h2>
        <p className="text-muted">
          {module?.description || 'Explorez nos cours interactifs'}
        </p>
      </div>
      
      {courses.length === 0 ? (
        <Alert variant="info">
          <p className="mb-0">Aucun cours disponible pour ce module.</p>
          <p className="mb-0">Revenez bientôt pour du nouveau contenu!</p>
        </Alert>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {courses.map(course => (
            <Col key={course._id}>
              <Card className="h-100 course-card">
                <Card.Body>
                  <Card.Title>{course.title}</Card.Title>
                  <Card.Text>{course.description}</Card.Text>
                  <div className="course-stats mb-3">
                    {course.quizzes?.length > 0 && (
                      <Badge bg="info" className="me-2">
                        {course.quizzes.length} Quiz
                      </Badge>
                    )}
                    {course.duration && (
                      <Badge bg="secondary">
                        {course.duration}
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="primary"
                    onClick={() => navigateToCourse(course._id)}
                    className="w-100"
                  >
                    Accéder au cours
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default CourseList;
