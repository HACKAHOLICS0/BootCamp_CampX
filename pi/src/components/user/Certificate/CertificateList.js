import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { FaAward, FaDownload, FaEye, FaCalendarAlt, FaPercentage, FaCheck, FaClock } from 'react-icons/fa';
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
      <Container className="certificates-container mt-4 text-center">
        <h2 className="mb-4">
          <span className="camp-x-title">CAMP X</span>
          <span className="certificate-title-separator"></span>
          Mes Certificats
        </h2>
        <div className="loading-container p-5">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 text-muted">Chargement de vos certificats...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="certificates-container mt-4">
        <h2 className="mb-4">
          <span className="camp-x-title">CAMP X</span>
          <span className="certificate-title-separator"></span>
          Mes Certificats
        </h2>
        <Alert variant="danger" className="error-alert">
          <Alert.Heading>
            <i className="fa fa-exclamation-circle me-2"></i>
            Une erreur est survenue
          </Alert.Heading>
          <p>{error}</p>
          <hr />
          <p className="mb-0">
            Veuillez réessayer plus tard ou contacter le support si le problème persiste.
          </p>
        </Alert>
      </Container>
    );
  }

  if (certificates.length === 0) {
    return (
      <Container className="certificates-container mt-4">
        <h2 className="mb-4">
          <span className="camp-x-title">CAMP X</span>
          <span className="certificate-title-separator"></span>
          Mes Certificats
        </h2>
        <div className="empty-certificates p-4 text-center">
          <div className="empty-logo mb-3">
            <span className="camp-x-logo empty">CAMP X</span>
          </div>
          <h3>Aucun certificat disponible</h3>
          <p className="text-muted">
            Vous n'avez pas encore obtenu de certificat. Complétez des cours et réussissez les quiz finaux pour obtenir vos certificats!
          </p>
          <Button
            variant="primary"
            as={Link}
            to="/categories"
            className="mt-3"
          >
            Explorer les cours
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="certificates-container mt-4">
      <h2 className="mb-4">
        <span className="camp-x-title">CAMP X</span>
        <span className="certificate-title-separator"></span>
        Mes Certificats
      </h2>

      <div className="certificates-grid">
        {certificates.map((certificate, index) => (
          <div key={certificate._id} className="certificate-item" style={{ animationDelay: `${index * 0.1}s` }}>
            <Card className="certificate-card h-100">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span className="certificate-date">
                  <FaCalendarAlt className="me-1" /> {formatDate(certificate.issueDate)}
                </span>
                <Badge
                  bg={certificate.status === 'active' ? 'success' : 'warning'}
                  className="certificate-status"
                >
                  {certificate.status === 'active' ? (
                    <><FaCheck className="me-1" /> Actif</>
                  ) : (
                    <><FaClock className="me-1" /> Expiré</>
                  )}
                </Badge>
              </Card.Header>
              <Card.Body>
                <div className="certificate-logo">
                  <span className="camp-x-logo">CAMP X</span>
                </div>
                <Card.Title>{certificate.course.title}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">{certificate.module.title}</Card.Subtitle>
                <div className="certificate-details">
                  <p>
                    <strong>Score:</strong>
                    <span><FaPercentage className="me-1" /> {certificate.percentage}%</span>
                  </p>
                  <p>
                    <strong>N° Certificat:</strong>
                    <span className="certificate-number">{certificate.certificateNumber}</span>
                  </p>
                  {certificate.expiryDate && (
                    <p>
                      <strong>Expire le:</strong>
                      <span>{formatDate(certificate.expiryDate)}</span>
                    </p>
                  )}
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
          </div>
        ))}
      </div>
    </Container>
  );
};

export default CertificateList;
