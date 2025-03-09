import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import Cookies from 'js-cookie';
import './ModuleStyle.css';

const backendURL = "http://localhost:5001/api";

const ModuleList = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [categoryId]);

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

      const [moduleRes, categoryRes] = await Promise.all([
        fetch(`${backendURL}/modules/category/${categoryId}`, config),
        fetch(`${backendURL}/categories/${categoryId}`, config)
      ]);

      if (!moduleRes.ok || !categoryRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [modulesData, categoryData] = await Promise.all([
        moduleRes.json(),
        categoryRes.json()
      ]);

      setModules(modulesData);
      setCategory(categoryData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError(error.message || 'Failed to load modules');
      setLoading(false);
    }
  };

  const navigateToCourses = (moduleId) => {
    navigate(`/categories/${categoryId}/modules/${moduleId}`);
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
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
      <div className="module-header mb-4">
        <h2>{category?.name || 'Modules'}</h2>
        <p className="text-muted">
          {category?.description || 'Explore our collection of interactive modules'}
        </p>
      </div>
      
      {modules.length === 0 ? (
        <Alert variant="info">
          <p className="mb-0">No modules available for this category.</p>
          <p className="mb-0">Check back soon for new content!</p>
        </Alert>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {modules.map(module => (
            <Col key={module._id}>
              <Card className="h-100 module-card">
                <Card.Body>
                  <Card.Title>{module.name}</Card.Title>
                  <Card.Text>{module.description}</Card.Text>
                  <div className="module-stats mb-3">
                    <small className="text-muted me-3">
                      {module.coursesCount || 0} courses
                    </small>
                    <small className="text-muted">
                      {module.duration || '0h'} total duration
                    </small>
                  </div>
                  <Button 
                    variant="primary"
                    onClick={() => navigateToCourses(module._id)}
                    className="w-100"
                  >
                    Explore Courses
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

export default ModuleList;
