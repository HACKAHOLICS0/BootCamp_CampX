import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Button, Badge } from 'react-bootstrap';
import './QuizResultView.css';

const QuizResultView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryId, moduleId, courseId, quizId } = useParams();
  const result = location.state?.result;

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
            <Card.Title className="text-center">No Result Available</Card.Title>
            <p className="text-center">Quiz result not found. Please try taking the quiz again.</p>
            <div className="text-center">
              <Button
                variant="primary"
                onClick={handleReturn}
              >
                Return to {courseId ? 'Course' : 'Categories'}
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
        title: 'Excellent work! 🎉',
        message: "You've demonstrated a strong understanding of the material.",
        variant: 'success'
      };
    } else if (percentage >= 60) {
      return {
        title: 'Good effort! 👍',
        message: "You're on the right track, but there's room for improvement.",
        variant: 'warning'
      };
    } else {
      return {
        title: 'Keep practicing! 💪',
        message: 'Review the course material and try again to improve your score.',
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
                <Button
                  variant="outline-success"
                  href={`/certificates/${result.certificate.id}`}
                  className="mt-2"
                >
                  Voir mon certificat
                </Button>
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