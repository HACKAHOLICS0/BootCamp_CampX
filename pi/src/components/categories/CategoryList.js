import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import './CategoryStyle.css';

const backendURL = "http://localhost:5001/api";

const CategoryList = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${backendURL}/categories`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      setCategories(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setError(error.message || 'Failed to load categories');
      setLoading(false);
    }
  };

  const navigateToModules = (categoryId) => {
    navigate(`/categories/${categoryId}/modules`);
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
      <h2 className="mb-4">Available Categories</h2>
      <Row xs={1} md={2} lg={3} className="g-4">
        {categories.map((category) => (
          <Col key={category._id}>
            <Card 
              className="h-100 category-card"
              onClick={() => navigateToModules(category._id)}
              style={{ cursor: 'pointer' }}
            >
              <Card.Body>
                <div className="category-icon mb-3">
                  <img 
                    src={category.icon || '/default-category-icon.png'} 
                    alt={category.name}
                    className="img-fluid"
                  />
                </div>
                <Card.Title>{category.name}</Card.Title>
                <Card.Text>{category.description}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default CategoryList;
