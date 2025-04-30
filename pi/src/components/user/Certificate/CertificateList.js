import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { FaAward, FaDownload, FaEye } from 'react-icons/fa';
import './CertificateList.css';
import config from '../../../config';

const CertificateList = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const token = Cookies.get('token');
        if (!token) {
          setError('Vous devez être connecté pour voir vos certificats');
          setLoading(false);
          return;
        }

        const response = await axios.get(`${config.API_URL}/api/certificates/user`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setCertificates(response.data);
      } catch (err) {
        console.error('Erreur lors de la récupération des certificats:', err);
        setError(err.response?.data?.error || 'Erreur lors du chargement des certificats');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  const handleDownload = async (certificateId) => {
    try {
      const token = Cookies.get('token');
      if (!token) return;

      // Faire une requête pour obtenir le PDF
      const response = await axios.get(`${config.API_URL}/api/certificates/${certificateId}/pdf`, {
        headers: { 
          Authorization: `Bearer ${token}` 
        },
        responseType: 'blob' // Important pour recevoir des données binaires
      });

      // Créer un URL pour le blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Créer un lien temporaire et cliquer dessus pour télécharger
      const link = document.createElement('a');
      link.href = url;
      const certificate = certificates.find(cert => cert._id === certificateId);
      link.setAttribute('download', `certificat-${certificate.certificateNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erreur lors du téléchargement du certificat:', err);
      setError('Erreur lors du téléchargement du certificat');
    }
  };

  // Formater les dates
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" />
        <p>Chargement de vos certificats...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Erreur</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </Container>
    );
  }

  if (certificates.length === 0) {
    return (
      <Container className="mt-4">
        <Alert variant="info">
          <Alert.Heading>Aucun certificat</Alert.Heading>
          <p>Vous n'avez pas encore obtenu de certificat. Complétez des cours pour en obtenir!</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="certificates-container mt-4">
      <h2 className="mb-4">
        <FaAward className="me-2" />
        Mes Certificats
      </h2>
      
      <Row>
        {certificates.map(certificate => (
          <Col md={6} lg={4} key={certificate._id} className="mb-4">
            <Card className="certificate-card h-100">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span className="certificate-date">{formatDate(certificate.issueDate)}</span>
                <span className={`certificate-status badge bg-${certificate.status === 'active' ? 'success' : 'warning'}`}>
                  {certificate.status === 'active' ? 'Actif' : 'Expiré'}
                </span>
              </Card.Header>
              <Card.Body>
                <div className="certificate-icon">
                  <FaAward size={40} color="#1E88E5" />
                </div>
                <Card.Title>{certificate.course.title}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">{certificate.module.title}</Card.Subtitle>
                <div className="certificate-details">
                  <p><strong>Score:</strong> {certificate.percentage}%</p>
                  <p><strong>N° Certificat:</strong> {certificate.certificateNumber}</p>
                </div>
              </Card.Body>
              <Card.Footer className="d-flex justify-content-between">
                <Button 
                  as={Link} 
                  to={`/certificates/${certificate._id}`}
                  variant="outline-primary"
                  size="sm"
                >
                  <FaEye className="me-1" /> Voir
                </Button>
                <Button 
                  variant="primary"
                  size="sm"
                  onClick={() => handleDownload(certificate._id)}
                >
                  <FaDownload className="me-1" /> Télécharger
                </Button>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default CertificateList;
