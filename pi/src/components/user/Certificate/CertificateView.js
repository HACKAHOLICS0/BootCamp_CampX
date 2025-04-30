import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import Cookies from 'js-cookie';
import { FaDownload, FaShare } from 'react-icons/fa';
import './CertificateView.css';
import config from '../../../config';

const CertificateView = () => {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const token = Cookies.get('token');
        if (!token) {
          navigate('/signin');
          return;
        }

        const response = await axios.get(`${config.API_URL}/api/certificates/${certificateId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setCertificate(response.data);
        
        // Générer l'URL de partage
        const verifyUrl = `${window.location.origin}/verify-certificate/${response.data.certificateNumber}`;
        setShareUrl(verifyUrl);
      } catch (err) {
        console.error('Erreur lors de la récupération du certificat:', err);
        setError(err.response?.data?.error || 'Erreur lors du chargement du certificat');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [certificateId, navigate]);

  const handleDownload = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        navigate('/signin');
        return;
      }

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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Mon certificat de formation',
        text: `Vérifiez mon certificat de formation pour ${certificate.course.title}`,
        url: shareUrl
      })
      .catch(err => console.error('Erreur lors du partage:', err));
    } else {
      // Copier l'URL dans le presse-papier
      navigator.clipboard.writeText(shareUrl)
        .then(() => alert('Lien de vérification copié dans le presse-papier!'))
        .catch(err => console.error('Erreur lors de la copie:', err));
    }
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <p>Chargement du certificat...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>Erreur</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-primary" onClick={() => navigate(-1)}>Retour</Button>
        </Alert>
      </Container>
    );
  }

  if (!certificate) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">
          <Alert.Heading>Certificat non trouvé</Alert.Heading>
          <p>Le certificat demandé n'existe pas ou vous n'avez pas les droits pour y accéder.</p>
          <Button variant="outline-primary" onClick={() => navigate(-1)}>Retour</Button>
        </Alert>
      </Container>
    );
  }

  // Formater les dates
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  return (
    <Container className="certificate-container mt-5">
      <Card className="certificate-card">
        <Card.Header className="text-center">
          <h2>Certificat de Réussite</h2>
        </Card.Header>
        <Card.Body>
          <div className="certificate-content">
            <div className="certificate-header">
              <div className="certificate-logo">
                {/* Logo de l'école ou de la plateforme */}
                <img src="/logo.png" alt="Logo" className="img-fluid" />
              </div>
              <div className="certificate-title">
                <h3>Certificat de Réussite</h3>
                <p className="certificate-number">N° {certificate.certificateNumber}</p>
              </div>
            </div>

            <div className="certificate-body">
              <p className="certificate-text">Ce certificat est décerné à</p>
              <h4 className="certificate-name">{certificate.user.name} {certificate.user.lastName}</h4>
              <p className="certificate-text">pour avoir complété avec succès</p>
              <h5 className="certificate-course">{certificate.module.title}: {certificate.course.title}</h5>
              <p className="certificate-score">avec un score de {certificate.percentage}%</p>
            </div>

            <div className="certificate-footer">
              <div className="certificate-date">
                <p>Date d'émission: {formatDate(certificate.issueDate)}</p>
                {certificate.expiryDate && (
                  <p>Date d'expiration: {formatDate(certificate.expiryDate)}</p>
                )}
              </div>
              <div className="certificate-signature">
                <p>Signature</p>
                <div className="signature-line"></div>
              </div>
            </div>
          </div>
        </Card.Body>
        <Card.Footer className="text-center">
          <Button 
            variant="primary" 
            className="me-2"
            onClick={handleDownload}
          >
            <FaDownload className="me-2" /> Télécharger le certificat
          </Button>
          <Button 
            variant="outline-primary"
            onClick={handleShare}
          >
            <FaShare className="me-2" /> Partager
          </Button>
        </Card.Footer>
      </Card>
    </Container>
  );
};

export default CertificateView;
