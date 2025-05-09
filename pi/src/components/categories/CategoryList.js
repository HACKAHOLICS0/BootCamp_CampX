import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Alert, Button } from 'react-bootstrap';
import { FaGraduationCap, FaArrowRight, FaExclamationTriangle } from 'react-icons/fa';
import './CategoryStyle.css';

const backendURL = "https://ikramsegni.fr/api";

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
      <Container className="categories-container">
        <div className="loading-container">
          <Spinner animation="border" role="status" className="custom-spinner">
            <span className="visually-hidden">Chargement...</span>
          </Spinner>
          <p className="loading-text">Chargement des catégories...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="categories-container">
        <div className="error-container">
          <Alert variant="danger" className="custom-error">
            <div className="error-icon"><FaExclamationTriangle /></div>
            <h3>Une erreur est survenue</h3>
            <p>{error}</p>
            <Button
              variant="outline-danger"
              onClick={() => fetchCategories()}
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
    <Container className="categories-container">
      <div className="categories-header">
        <h2>Explorez nos catégories</h2>
        <p>Découvrez notre large éventail de catégories de cours pour développer vos compétences</p>
      </div>

      <div className="categories-grid">
        {categories.map((category) => (
          <div
            key={category._id}
            className="category-card"
            onClick={() => navigateToModules(category._id)}
          >
            <div className="category-icon">
              <div className="icon-wrapper">
                <FaGraduationCap />
              </div>
            </div>
            <h3>{category.name}</h3>
            <p>{category.description}</p>
            <div className="category-action">
              <span>Explorer les modules</span>
              <FaArrowRight className="arrow-icon" />
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
};

export default CategoryList;
