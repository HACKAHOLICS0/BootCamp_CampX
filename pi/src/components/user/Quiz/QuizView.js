import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, ProgressBar } from 'react-bootstrap';
import axios from 'axios';
import config from '../../../config';
import './QuizView.css';

const QuizView = () => {
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { quizId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching quiz:', quizId); // Debug log

        const response = await axios.get(`${config.API_URL}${config.endpoints.quizzes}/student/${quizId}`);
        console.log('Quiz response:', response.data); // Debug log

        if (!response.data || !response.data.Questions || response.data.Questions.length === 0) {
          throw new Error('No questions available for this quiz');
        }

        setQuiz(response.data);
        setTimeLeft(response.data.chronoVal * 60); // Convert minutes to seconds
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      fetchQuiz();
    }
  }, [quizId]);

  useEffect(() => {
    let timer;
    if (timeLeft > 0 && quiz && !submitting) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft, quiz, submitting]);

  const handleAnswerSelect = (questionId, answerId) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  const handleSubmit = async () => {
    if (!quiz || !quiz.Questions || quiz.Questions.length === 0) {
      setError('No questions available to submit');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await axios.post(`${config.API_URL}${config.endpoints.quizzes}/submit`, {
        quizId: quiz._id,
        userId: '000000000000000000000000', // Placeholder user ID
        answers: selectedAnswers
      });

      // Navigate to results page with the response data
      navigate(`results`, { state: { result: response.data } });
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError(err.response?.data?.error || 'Failed to submit quiz');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex justify-content-end">
            <Button variant="outline-danger" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!quiz || !quiz.Questions || quiz.Questions.length === 0) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          <Alert.Heading>No Questions Available</Alert.Heading>
          <p>This quiz has no questions available.</p>
          <div className="d-flex justify-content-end">
            <Button variant="outline-warning" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  const question = quiz.Questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.Questions.length) * 100;

  return (
    <Container className="mt-4">
      <Card className="quiz-card">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h3>{quiz.title}</h3>
            <div className="timer">Time Left: {formatTime(timeLeft)}</div>
          </div>
          <ProgressBar now={progress} label={`${Math.round(progress)}%`} className="mt-2" />
        </Card.Header>
        <Card.Body>
          <div className="question-counter mb-3">
            Question {currentQuestion + 1} of {quiz.Questions.length}
          </div>

          <Card.Title className="question-text">
            {question.texte}
          </Card.Title>

          <Form>
            {question.Responses && question.Responses.map((response) => (
              <Form.Check
                key={response._id}
                type="radio"
                id={response._id}
                label={response.texte}
                name={`question-${question._id}`}
                checked={selectedAnswers[question._id] === response._id}
                onChange={() => handleAnswerSelect(question._id, response._id)}
                className="response-option mb-2"
              />
            ))}
          </Form>

          <div className="navigation-buttons mt-4">
            <Button
              variant="secondary"
              disabled={currentQuestion === 0}
              onClick={() => setCurrentQuestion(prev => prev - 1)}
            >
              Previous
            </Button>
            {currentQuestion < quiz.Questions.length - 1 ? (
              <Button
                variant="primary"
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                disabled={!selectedAnswers[question._id]}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="success"
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !selectedAnswers[question._id] ||
                  Object.keys(selectedAnswers).length !== quiz.Questions.length
                }
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default QuizView;
