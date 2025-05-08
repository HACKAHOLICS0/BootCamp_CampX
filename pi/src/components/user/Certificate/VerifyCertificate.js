import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaSearch, FaCheck, FaTimes } from 'react-icons/fa';
import './VerifyCertificate.css';
import config from '../../../config';

const VerifyCertificate = () => {
  const { certificateNumber } = useParams();
  const navigate = useNavigate();
  const [number, setNumber] = useState(certificateNumber || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!number.trim()) {
      setError('Veuillez entrer un numéro de certificat');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.get(`${config.API_URL}/api/certificates/verify/${number.trim()}`);
      setResult(response.data);
    } catch (err) {
      console.error('Erreur lors de la vérification du certificat:', err);
      setError(err.response?.data?.error || 'Erreur lors de la vérification du certificat');
    } finally {
      setLoading(false);
    }
  };

  // Formater les dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  return (
    <Container className="verify-certificate-container mt-5">
      <Card className="verify-card">
        <Card.Header className="text-center">
          <h2><span className="camp-x-verify">CAMP X</span> Vérification de Certificat</h2>
        </Card.Header>
        <Card.Body>
          <p className="text-center mb-4">
            Entrez le numéro de certificat pour vérifier son authenticité et sa validité.
          </p>

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Numéro de certificat</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  placeholder="Ex: CERT-12345678-9012"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="ms-2"
                  disabled={loading}
                >
                  {loading ? (
                    <Spinner as="span" animation="border" size="sm" />
                  ) : (
                    <><FaSearch /> Vérifier</>
                  )}
                </Button>
              </div>
            </Form.Group>
          </Form>

          {error && (
            <Alert variant="danger" className="mt-4">
              <Alert.Heading>Erreur</Alert.Heading>
              <p>{error}</p>
            </Alert>
          )}

          {result && (
            <div className="verification-result mt-4">
              <div className={`result-status ${result.valid ? 'valid' : 'invalid'}`}>
                {result.valid ? (
                  <>
                    <FaCheck size={30} />
                    <h3>Certificat Valide</h3>
                  </>
                ) : (
                  <>
                    <FaTimes size={30} />
                    <h3>Certificat {result.status === 'expired' ? 'Expiré' : 'Invalide'}</h3>
                  </>
                )}
              </div>

              {result.certificate && (
                <Card className="certificate-details-card mt-4">
                  <Card.Header>Détails du Certificat</Card.Header>
                  <Card.Body>
                    <div className="certificate-info">
                      <div className="info-item">
                        <span className="info-label">Numéro:</span>
                        <span className="info-value">{result.certificate.number}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Délivré à:</span>
                        <span className="info-value">{result.certificate.userName}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Module:</span>
                        <span className="info-value">{result.certificate.moduleName}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Cours:</span>
                        <span className="info-value">{result.certificate.courseName}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Date d'émission:</span>
                        <span className="info-value">{formatDate(result.certificate.issueDate)}</span>
                      </div>
                      {result.certificate.expiryDate && (
                        <div className="info-item">
                          <span className="info-label">Date d'expiration:</span>
                          <span className="info-value">{formatDate(result.certificate.expiryDate)}</span>
                        </div>
                      )}
                      <div className="info-item">
                        <span className="info-label">Statut:</span>
                        <span className={`info-value status-${result.status}`}>
                          {result.status === 'active' ? 'Actif' : result.status === 'expired' ? 'Expiré' : 'Révoqué'}
                        </span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default VerifyCertificate;
