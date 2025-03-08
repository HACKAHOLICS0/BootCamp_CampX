import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, ProgressBar, Badge } from 'react-bootstrap';
import Cookies from 'js-cookie';
import './QuizView.css';

const backendURL = "http://localhost:5001/api";

const QuizView = () => {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const submitQuiz = useCallback(async () => {
    try {
      const token = Cookies.get('token');
      const response = await fetch(`${backendURL}/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quizId,
          courseId,
          answers,
          timeSpent: quiz.chronoVal * 60 - timeLeft
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }
      
      const result = await response.json();
      navigate(`/quiz-result/${quizId}`, { state: { result } });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setError('Failed to submit quiz. Please try again.');
    }
  }, [quizId, courseId, answers, timeLeft, quiz, navigate]);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const token = Cookies.get('token');
        const response = await fetch(`${backendURL}/quiz/${quizId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch quiz');
        }
        
        const data = await response.json();
        setQuiz(data);
        if (data.chronoVal) {
          setTimeLeft(data.chronoVal * 60); // Convert minutes to seconds
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    
    if (quizId) {
      fetchQuiz();
    }
  }, [quizId]);

  useEffect(() => {
    let timer;
    if (isQuizStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            submitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isQuizStarted, timeLeft, submitQuiz]);

  const startQuiz = () => {
    setIsQuizStarted(true);
  };

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  if (loading) {
    return (
      <Container className="quiz-loading">
        <div className="spinner"></div>
        <p>Chargement du quiz...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="quiz-error">
        <Card>
          <Card.Body>
            <Card.Title className="text-danger">Erreur</Card.Title>
            <Card.Text>{error}</Card.Text>
            <Button variant="primary" onClick={() => navigate(`/courses/${courseId}`)}>
              Retourner au cours
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (!quiz) {
    return (
      <Container className="quiz-not-found">
        <Card>
          <Card.Body>
            <Card.Title>Quiz non trouvé</Card.Title>
            <Card.Text>Le quiz que vous cherchez n'existe pas ou n'est pas accessible.</Card.Text>
            <Button variant="primary" onClick={() => navigate(`/courses/${courseId}`)}>
              Retourner au cours
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isQuizStarted) {
    return (
      <Container className="quiz-intro">
        <div className="quiz-intro-card">
          <Card>
            <Card.Body>
              <Card.Title className="quiz-title">{quiz.title}</Card.Title>
              <div className="quiz-info">
                <Badge bg="info">
                  {quiz.questions?.length || 0} Questions
                </Badge>
                {quiz.chronoVal && (
                  <Badge bg="warning">
                    Temps: {quiz.chronoVal} minutes
                  </Badge>
                )}
              </div>
              <Card.Text className="quiz-instructions">
                Prenez votre temps pour lire attentivement chaque question.
                Une fois commencé, le chronomètre ne peut pas être mis en pause.
              </Card.Text>
              <Button 
                variant="primary" 
                size="lg" 
                onClick={startQuiz}
                className="start-button"
              >
                Commencer le Quiz
              </Button>
            </Card.Body>
          </Card>
        </div>
      </Container>
    );
  }

  const currentQuestionData = quiz.questions?.[currentQuestion];
  const progress = quiz.questions ? ((currentQuestion + 1) / quiz.questions.length) * 100 : 0;

  if (!currentQuestionData) {
    return (
      <Container className="quiz-error">
        <Card>
          <Card.Body>
            <Card.Title>Erreur de chargement</Card.Title>
            <Card.Text>Impossible de charger la question actuelle.</Card.Text>
            <Button variant="primary" onClick={() => navigate(`/courses/${courseId}`)}>
              Retourner au cours
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="quiz-container">
      <div className="quiz-header">
        <div className="quiz-progress">
          <span>Question {currentQuestion + 1}/{quiz.questions.length}</span>
          <ProgressBar now={progress} variant="success" />
        </div>
        {timeLeft !== null && (
          <div className="quiz-timer">
            <span className={timeLeft < 60 ? 'time-warning' : ''}>
              ⏱️ {formatTime(timeLeft)}
            </span>
          </div>
        )}
      </div>

      <div className="question-card">
        <Card>
          <Card.Body>
            <Card.Title>{currentQuestionData.texte || currentQuestionData.question}</Card.Title>
            {currentQuestionData.code && (
              <pre className={`language-${currentQuestionData.language || 'plaintext'}`}>
                <code>{currentQuestionData.code}</code>
              </pre>
            )}
            <div className="options-container">
              {currentQuestionData.Responses?.map((option, index) => (
                <Button
                  key={index}
                  variant={
                    answers[currentQuestionData._id] === option
                      ? 'primary'
                      : 'outline-primary'
                  }
                  className="option-button"
                  onClick={() => handleAnswerSelect(currentQuestionData._id, option)}
                >
                  {option.text || option}
                </Button>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>

      <div className="quiz-navigation">
        <Button
          variant="outline-primary"
          onClick={() => setCurrentQuestion(prev => prev - 1)}
          disabled={currentQuestion === 0}
        >
          Précédent
        </Button>
        
        {currentQuestion < quiz.questions.length - 1 ? (
          <Button
            variant="outline-primary"
            onClick={() => setCurrentQuestion(prev => prev + 1)}
          >
            Suivant
          </Button>
        ) : (
          <Button
            variant="success"
            onClick={submitQuiz}
          >
            Terminer le Quiz
          </Button>
        )}
      </div>

      <div className="question-dots">
        {quiz.questions.map((_, index) => (
          <Button
            key={index}
            variant={currentQuestion === index ? 'primary' : 'outline-primary'}
            className={`question-dot ${answers[quiz.questions[index]._id] ? 'answered' : ''}`}
            onClick={() => setCurrentQuestion(index)}
          >
            {index + 1}
          </Button>
        ))}
      </div>
    </Container>
  );
};

export default QuizView;
