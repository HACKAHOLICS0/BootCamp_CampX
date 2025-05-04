import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Button, Badge } from 'react-bootstrap';
import axios from 'axios';
import config from '../../../config';
import './QuizResultView.css';

const QuizResultView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryId, moduleId, courseId, quizId } = useParams();
  const result = location.state?.result;

  // Fonction pour télécharger le certificat
  const downloadCertificate = (certificateId, certificateNumber) => {
    try {
      // Afficher un message de chargement
      console.log("Préparation du téléchargement du certificat...");

      // Récupérer le token depuis le localStorage
      const token = localStorage.getItem('token');
      console.log("Token utilisé:", token ? "Présent" : "Absent");

      if (!token) {
        alert("Vous devez être connecté pour télécharger votre certificat.");
        return;
      }

      // Créer une iframe cachée pour télécharger le fichier
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      // Définir l'URL avec le token dans les paramètres de requête
      const url = `${config.API_URL}/api/certificates/${certificateId}/pdf?token=${token}`;

      // Charger l'URL dans l'iframe
      iframe.src = url;

      // Supprimer l'iframe après le chargement
      iframe.onload = () => {
        console.log("Téléchargement initié");
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 2000);
      };

      console.log("Téléchargement en cours...");
    } catch (error) {
      console.error("Erreur lors du téléchargement du certificat:", error);
      alert("Une erreur est survenue lors du téléchargement du certificat. Veuillez réessayer.");
    }
  };

  const handleReturn = () => {
    if (categoryId && moduleId && courseId) {
      // Rediriger vers la page du cours avec l'onglet quiz actif
      navigate(`/categories/${categoryId}/modules/${moduleId}/courses/${courseId}`, {
        state: { activeTab: 'quiz' }
      });
    } else {
      // Pour les quiz autonomes, rediriger vers la liste des quiz ou une autre page appropriée
      navigate('/categories');
    }
  };

  if (!result) {
    return (
      <Container className="mt-4">
        <Card>
          <Card.Body>
            <Card.Title className="text-center">Aucun résultat disponible</Card.Title>
            <p className="text-center">Résultat du quiz introuvable. Veuillez réessayer de passer le quiz.</p>
            <div className="text-center">
              <Button
                variant="primary"
                onClick={handleReturn}
              >
                Retour au {courseId ? 'cours' : 'catégories'}
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'danger';
  };

  const getFeedback = (percentage) => {
    if (percentage >= 80) {
      return {
        title: 'Excellent travail ! 🎉',
        message: "Vous avez démontré une forte compréhension du contenu.",
        variant: 'success'
      };
    } else if (percentage >= 60) {
      return {
        title: 'Bon effort ! 👍',
        message: "Vous êtes sur la bonne voie, mais il y a encore place à l'amélioration.",
        variant: 'warning'
      };
    } else if (percentage >= 50) {
      return {
        title: 'Vous avez réussi ! ✅',
        message: 'Vous avez obtenu le score minimum requis pour passer au quiz suivant.',
        variant: 'warning'
      };
    } else {
      return {
        title: 'Continuez à vous entraîner ! 💪',
        message: 'Révisez le contenu du cours et réessayez pour améliorer votre score.',
        variant: 'danger'
      };
    }
  };

  const feedback = getFeedback(result.percentage);

  const getFraudMessage = (fraudDetection) => {
    if (!fraudDetection || !fraudDetection.isSuspicious) return null;

    const messages = {
      'TOO_FAST': 'Certaines réponses ont été données trop rapidement.',
      'INCONSISTENT_TIME': 'Incohérence détectée dans les temps de réponse.',
      'UNREALISTIC_SCORE': 'Score irréaliste compte tenu des temps de réponse.'
    };

    return (
      <div className="fraud-alert alert alert-warning mt-3">
        <h5>⚠️ Attention</h5>
        <p>Des comportements suspects ont été détectés :</p>
        <ul>
          {fraudDetection.reasons.map(reason => (
            <li key={reason}>{messages[reason]}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <Container className="mt-4">
      <Card className="result-card">
        <Card.Header as="h4" className="text-center">Résultats du Quiz</Card.Header>
        <Card.Body>
          <div className="text-center mb-4">
            <h2>
              <Badge bg={getScoreColor(result.percentage)} className="score-badge">
                Score: {result.score} / {result.totalPoints}
              </Badge>
            </h2>
            <h3>
              <Badge bg={getScoreColor(result.percentage)} className="percentage-badge">
                {result.percentage}%
              </Badge>
            </h3>
          </div>

          {result.fraudDetection && getFraudMessage(result.fraudDetection)}

          <div className="result-stats">
            <div className="stat-item">
              <span className="stat-label">Questions totales:</span>
              <span className="stat-value">{result.totalQuestions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Points obtenus:</span>
              <span className="stat-value">{result.score}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Points totaux:</span>
              <span className="stat-value">{result.totalPoints}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Pourcentage:</span>
              <span className="stat-value">{result.percentage}%</span>
            </div>
          </div>

          <div className="feedback-section mt-4">
            <div className={`alert alert-${feedback.variant}`}>
              <h5>{feedback.title}</h5>
              <p>{feedback.message}</p>
            </div>
          </div>

          {/* Afficher le message de certificat si disponible */}
          {result.certificate && (
            <div className="certificate-section mt-4">
              <div className="alert alert-success">
                <h5><i className="fas fa-award me-2"></i> Certificat Obtenu!</h5>
                <p>{result.certificate.message}</p>
                <div className="d-flex justify-content-center mt-3">
                  <Button
                    variant="success"
                    onClick={() => downloadCertificate(result.certificate.id, result.certificate.number)}
                    className="me-2"
                  >
                    <i className="fas fa-download me-2"></i> Télécharger le certificat
                  </Button>
                  <Button
                    variant="outline-success"
                    onClick={() => navigate('/profile', { state: { activeTab: 'certificates' } })}
                    className="ms-2"
                  >
                    <i className="fas fa-certificate me-2"></i> Voir mes certificats
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Afficher un message d'erreur si la génération du certificat a échoué */}
          {result.certificateError && (
            <div className="certificate-error-section mt-4">
              <div className="alert alert-warning">
                <h5><i className="fas fa-exclamation-triangle me-2"></i> Information</h5>
                <p>{result.certificateError}</p>
              </div>
            </div>
          )}

          {/* Afficher des informations de débogage pour les quiz finaux */}
          {result.isFinalQuiz && !result.certificate && (
            <div className="debug-section mt-4">
              <div className="alert alert-info">
                <h5><i className="fas fa-info-circle me-2"></i> Informations de débogage</h5>
                <p>Ce quiz est marqué comme un quiz final.</p>
                <p>Score: {result.score}/{result.totalPoints} ({result.percentage}%)</p>
                <p>Fraude détectée: {result.fraudDetection && result.fraudDetection.isSuspicious ? 'Oui' : 'Non'}</p>
                {result.fraudDetection && result.fraudDetection.reasons && result.fraudDetection.reasons.length > 0 && (
                  <p>Raisons: {result.fraudDetection.reasons.join(', ')}</p>
                )}
                <div className="mt-3">
                  <Button
                    variant="outline-primary"
                    onClick={() => {
                      // Afficher toutes les données de résultat dans la console
                      console.log("Données complètes du résultat:", result);
                    }}
                  >
                    <i className="fas fa-bug me-2"></i> Afficher les données complètes dans la console
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card.Body>
        <Card.Footer className="text-center">
          <Button
            variant="primary"
            onClick={handleReturn}
            className="me-2"
          >
            Retour aux {courseId ? 'quiz du cours' : 'catégories'}
          </Button>
          {quizId && (
            <Button
              variant="outline-primary"
              onClick={() => window.location.reload()}
            >
              Réessayer
            </Button>
          )}
        </Card.Footer>
      </Card>
    </Container>
  );
};

export default QuizResultView;