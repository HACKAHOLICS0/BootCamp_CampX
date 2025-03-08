import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Button, Badge } from 'react-bootstrap';
import './QuizResultView.css';

const QuizResultView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryId, moduleId, courseId } = useParams();
  const result = location.state?.result;

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
                onClick={() => navigate(`/categories/${categoryId}/modules/${moduleId}/courses/${courseId}`)}
              >
                Return to Course
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

  return (
    <Container className="mt-4">
      <Card className="result-card">
        <Card.Header as="h4" className="text-center">Quiz Results</Card.Header>
        <Card.Body>
          <div className="text-center mb-4">
            <h2>
              <Badge bg={getScoreColor(result.percentage)}>
                Score: {result.score} / {result.totalPoints}
              </Badge>
            </h2>
            <h3>
              <Badge bg={getScoreColor(result.percentage)}>
                {result.percentage}%
              </Badge>
            </h3>
          </div>

          <div className="result-stats">
            <div className="stat-item">
              <span className="stat-label">Total Questions:</span>
              <span className="stat-value">{result.totalQuestions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Points Earned:</span>
              <span className="stat-value">{result.score}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Points:</span>
              <span className="stat-value">{result.totalPoints}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Percentage:</span>
              <span className="stat-value">{result.percentage}%</span>
            </div>
          </div>

          <div className="feedback-section mt-4">
            {result.percentage >= 80 && (
              <div className="alert alert-success">
                <h5>Excellent work! 🎉</h5>
                <p>You've demonstrated a strong understanding of the material.</p>
              </div>
            )}
            {result.percentage >= 60 && result.percentage < 80 && (
              <div className="alert alert-warning">
                <h5>Good effort! 👍</h5>
                <p>You're on the right track, but there's room for improvement.</p>
              </div>
            )}
            {result.percentage < 60 && (
              <div className="alert alert-danger">
                <h5>Keep practicing! 💪</h5>
                <p>Review the course material and try again to improve your score.</p>
              </div>
            )}
          </div>
        </Card.Body>
        <Card.Footer className="text-center">
          <Button 
            variant="primary"
            onClick={() => navigate(`/categories/${categoryId}/modules/${moduleId}/courses/${courseId}`)}
            className="me-2"
          >
            Return to Course
          </Button>
        </Card.Footer>
      </Card>
    </Container>
  );
};

export default QuizResultView;
