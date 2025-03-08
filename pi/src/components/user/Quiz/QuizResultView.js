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
      navigate(`/categories/${categoryId}/modules/${moduleId}/courses/${courseId}`);
    } else {
      navigate('/categories'); // Or wherever you want to redirect for standalone quizzes
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

  return (
    <Container className="mt-4">
      <Card className="result-card">
        <Card.Header as="h4" className="text-center">Quiz Results</Card.Header>
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
            <div className={`alert alert-${feedback.variant}`}>
              <h5>{feedback.title}</h5>
              <p>{feedback.message}</p>
            </div>
          </div>
        </Card.Body>
        <Card.Footer className="text-center">
          <Button 
            variant="primary"
            onClick={handleReturn}
            className="me-2"
          >
            Return to {courseId ? 'Course' : 'Categories'}
          </Button>
          {quizId && (
            <Button 
              variant="outline-primary"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          )}
        </Card.Footer>
      </Card>
    </Container>
  );
};

export default QuizResultView;
