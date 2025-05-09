import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import Cookies from 'js-cookie';
import { FaBook, FaClock, FaArrowRight } from 'react-icons/fa';
import './ModuleStyle.css';

const backendURL = "https://ikramsegni.fr/api";

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
      <Container className="module-list-container">
        <div className="loading-container">
          <Spinner animation="border" role="status" className="custom-spinner">
            <span className="visually-hidden">Chargement...</span>
          </Spinner>
          <p className="loading-text">Chargement des modules...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="module-list-container">
        <div className="error-container">
          <Alert variant="danger" className="custom-error">
            <div className="error-icon">⚠️</div>
            <h3>Une erreur est survenue</h3>
            <p>{error}</p>
            <Button
              variant="outline-danger"
              onClick={() => fetchData()}
              className="retry-button"
            >
              Réessayer
            </Button>
          </Alert>
        </div>
      </Container>
    );
  }

  return (
    <Container className="module-list-container">
      <div className="module-header">
        <h2>{category?.name || 'Modules'}</h2>
        <p>
          {category?.description || 'Explorez notre collection de modules interactifs pour développer vos compétences'}
        </p>
      </div>

      {modules.length === 0 ? (
        <Alert variant="info" className="empty-modules-alert">
          <p className="mb-0">Aucun module disponible pour cette catégorie.</p>
          <p className="mb-0">Revenez bientôt pour découvrir notre nouveau contenu !</p>
        </Alert>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {modules.map(module => (
            <Col key={module._id} className="module-column">
              <Card className="module-card">
                <Card.Body>
                  <Card.Title>{module.name}</Card.Title>
                  <Card.Text>{module.description}</Card.Text>
                  <div className="module-stats">
                    <small>
                      <FaBook /> {module.coursesCount || 0} cours
                    </small>
                    <small>
                      <FaClock /> {module.duration || '0'}h durée totale
                    </small>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => navigateToCourses(module._id)}
                    className="explore-button"
                  >
                    Explorer les cours
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
