import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Alert } from 'react-bootstrap';
import RecommendedCourses from './RecommendedCourses';
import { FaSearch } from 'react-icons/fa';

const MarketCoursesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('programming');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [popularCategories, setPopularCategories] = useState([
    'javascript', 'python', 'web development', 'data science', 'machine learning',
    'react', 'node.js', 'html css', 'mobile development', 'devops'
  ]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setCategory(searchTerm);
    }
  };

  const handleCategoryClick = (cat) => {
    setSearchTerm(cat);
    setCategory(cat);
  };

  return (
    <Container className="py-5">
      <div className="text-center mb-5">
        <h1 className="display-4 mb-3">Explorez les meilleurs cours du marché</h1>
        <p className="lead text-muted">
          Découvrez des cours de qualité provenant des meilleures plateformes d'apprentissage en ligne
        </p>
        
        <Form onSubmit={handleSearch} className="d-flex justify-content-center mt-4">
          <Form.Group className="d-flex w-75">
            <Form.Control
              type="text"
              placeholder="Rechercher un sujet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="me-2 py-2"
            />
            <Button variant="primary" type="submit" className="px-4">
              <FaSearch className="me-2" /> Rechercher
            </Button>
          </Form.Group>
        </Form>
      </div>

      <div className="popular-categories mb-5">
        <h3 className="mb-3">Catégories populaires</h3>
        <div className="d-flex flex-wrap gap-2">
          {popularCategories.map((cat, index) => (
            <Button
              key={index}
              variant={category === cat ? "primary" : "outline-secondary"}
              onClick={() => handleCategoryClick(cat)}
              className="text-capitalize mb-2"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </Spinner>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <div className="market-courses-container">
          <RecommendedCourses category={category} limit={12} />
        </div>
      )}
    </Container>
  );
};

export default MarketCoursesPage;
