import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Alert, Card } from 'react-bootstrap';
import RecommendedVideos from './RecommendedVideos';
import { FaSearch, FaVideo, FaYoutube, FaGraduationCap, FaLaptopCode, FaChalkboardTeacher } from 'react-icons/fa';
import { SiCoursera, SiUdemy, SiKhanacademy } from 'react-icons/si';

const MarketVideosPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const [popularCategories, setPopularCategories] = useState([
    'javascript', 'python', 'web development', 'data science', 'machine learning',
    'react', 'node.js', 'html css', 'mobile development', 'devops'
  ]);

  const platforms = [
    { id: 'all', name: 'Toutes les plateformes', icon: <FaVideo />, color: '#0d6efd' },
    { id: 'coursera', name: 'Coursera', icon: <SiCoursera />, color: '#2A73CC' },
    { id: 'udemy', name: 'Udemy', icon: <SiUdemy />, color: '#A435F0' },
    { id: 'youtube', name: 'YouTube', icon: <FaYoutube />, color: '#FF0000' },
    { id: 'khan', name: 'Khan Academy', icon: <SiKhanacademy />, color: '#14BF96' }
  ];

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

  const handlePlatformChange = (platformId) => {
    setActiveTab(platformId);
  };

  return (
    <Container fluid className="py-5 px-md-5">
      {/* Hero Section */}
      <div className="text-center mb-5 py-5 bg-light rounded">
        <h1 className="display-4 mb-3 fw-bold">
          <FaVideo className="me-3 text-primary" />
          Vidéothèque E-Learning
        </h1>
        <p className="lead">
          Découvrez des milliers de vidéos de cours provenant des meilleures plateformes d'apprentissage en ligne
        </p>

        <Form onSubmit={handleSearch} className="d-flex justify-content-center mt-4">
          <Form.Group className="d-flex w-75">
            <Form.Control
              type="text"
              placeholder="Rechercher un sujet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="me-2 py-2 shadow-sm"
            />
            <Button variant="primary" type="submit" className="px-4 shadow-sm">
              <FaSearch className="me-2" /> Rechercher
            </Button>
          </Form.Group>
        </Form>
      </div>

      {/* Platforms Section */}
      <div className="mb-5">
        <h2 className="mb-4">Plateformes d'apprentissage</h2>
        <Row className="g-4">
          {platforms.map((platform) => (
            <Col key={platform.id} xs={6} md={4} lg={3} xl={2}>
              <Card
                className={`h-100 text-center shadow-sm ${activeTab === platform.id ? 'border-primary' : ''}`}
                onClick={() => handlePlatformChange(platform.id)}
                style={{ cursor: 'pointer' }}
              >
                <Card.Body className="d-flex flex-column justify-content-center align-items-center">
                  <div
                    className="platform-icon mb-3 d-flex align-items-center justify-content-center"
                    style={{
                      fontSize: '2rem',
                      color: platform.color,
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: `${platform.color}15`
                    }}
                  >
                    {platform.icon}
                  </div>
                  <Card.Title className="mb-0">{platform.name}</Card.Title>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Categories Section */}
      <div className="popular-categories mb-5">
        <h2 className="mb-3">Catégories populaires</h2>
        <div className="d-flex flex-wrap gap-2">
          {popularCategories.map((cat, index) => (
            <Button
              key={index}
              variant={category === cat ? "primary" : "outline-secondary"}
              onClick={() => handleCategoryClick(cat)}
              className="text-capitalize mb-2 shadow-sm"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Why Use Our Video Library Section */}
      <div className="mb-5 py-4 bg-light rounded">
        <h2 className="mb-4 text-center">Pourquoi utiliser notre vidéothèque ?</h2>
        <Row className="g-4">
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="feature-icon mb-3 mx-auto d-flex align-items-center justify-content-center"
                  style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#e6f7ff' }}>
                  <FaGraduationCap size={30} color="#0d6efd" />
                </div>
                <Card.Title>Contenu de qualité</Card.Title>
                <Card.Text>
                  Accédez aux meilleures vidéos de cours des plateformes d'apprentissage les plus reconnues, sélectionnées pour leur qualité pédagogique.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="feature-icon mb-3 mx-auto d-flex align-items-center justify-content-center"
                  style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#e6fff2' }}>
                  <FaLaptopCode size={30} color="#198754" />
                </div>
                <Card.Title>Tout en un seul endroit</Card.Title>
                <Card.Text>
                  Plus besoin de naviguer entre différentes plateformes. Regardez des vidéos de Coursera, Udemy, YouTube et d'autres, directement sur notre site.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="feature-icon mb-3 mx-auto d-flex align-items-center justify-content-center"
                  style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#fff2e6' }}>
                  <FaChalkboardTeacher size={30} color="#fd7e14" />
                </div>
                <Card.Title>Expérience d'apprentissage optimisée</Card.Title>
                <Card.Text>
                  Notre interface intuitive vous permet de trouver facilement des vidéos sur les sujets qui vous intéressent et de les regarder sans distraction.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Featured Videos Section */}
      <div className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">Vidéos recommandées</h2>
          <div className="d-flex align-items-center">
            <span className="me-2">Catégorie:</span>
            <span className="badge bg-primary text-capitalize">{category}</span>
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
          <div className="market-videos-container">
            <RecommendedVideos category={category} limit={12} />
          </div>
        )}
      </div>
    </Container>
  );
};

export default MarketVideosPage;
