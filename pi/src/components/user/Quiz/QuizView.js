import React, { useState, useEffect } from 'react';
import { Container, Button, Alert, Card, ProgressBar, Form, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FaceRecognition } from './FaceRecognition';
import config from '../../../config';
import Cookies from 'js-cookie';

const QuizView = () => {
  const { quizId } = useParams();
  const [userImage, setUserImage] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Récupérer l'image utilisateur pour la vérification
  useEffect(() => {
    const fetchUserImage = async () => {
      try {
        const storedUser = Cookies.get("user");
        if (!storedUser) return;
        const parsedUser = JSON.parse(storedUser);
        const token = Cookies.get('token');
        if (!token) return navigate('/login');

        const response = await axios.get(`${config.API_URL}/api/auth/profile/${parsedUser.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data?.image) {
          setUserImage(response.data.image);
        } else {
          navigate('/profile');
        }
      } catch {
        setError("Erreur lors de la récupération de l'image.");
      }
    };

    fetchUserImage();
  }, []);

  // Charger le quiz après la vérification faciale
  useEffect(() => {
    if (verificationComplete) {
      axios.get(`${config.API_URL}/api/quiz/${quizId}`)
        .then(res => {
          setQuiz(res.data);
          setTimeLeft(res.data.chronoVal * 60); // Convertir minutes en secondes
        })
        .catch(() => setError("Erreur lors du chargement du quiz"));
    }
  }, [verificationComplete, quizId]);

  // Timer pour le quiz
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
      setError('Aucune question disponible.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post(`${config.API_URL}/api/quiz/${quizId}/submit`, {
        answers: selectedAnswers
      });

      navigate(`/quiz/${quizId}/result`, { state: { result: response.data } });
    } catch (err) {
      setError(err.response?.data?.error || "Échec de la soumission du quiz.");
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container>
      {!verificationComplete ? (
        <Card>
          <Card.Header>Vérification d'identité</Card.Header>
          <Card.Body>
            {userImage ? (
              <FaceRecognition userImage={userImage} onVerificationComplete={setVerificationComplete} />
            ) : (
              <Spinner animation="border" />
            )}
          </Card.Body>
        </Card>
      ) : quiz ? (
        <Card className="mt-4">
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h3>{quiz.title}</h3>
              <div className="timer">Temps restant : {formatTime(timeLeft)}</div>
            </div>
            <ProgressBar now={((currentQuestion + 1) / quiz.Questions.length) * 100} className="mt-2" />
          </Card.Header>
          <Card.Body>
            <div className="question-counter mb-3">
              Question {currentQuestion + 1} sur {quiz.Questions.length}
            </div>

            <Card.Title className="question-text">{quiz.Questions[currentQuestion].texte}</Card.Title>

            <Form>
              {quiz.Questions[currentQuestion].Responses.map(response => (
                <Form.Check
                  key={response._id}
                  type="radio"
                  id={response._id}
                  label={response.texte}
                  name={`question-${quiz.Questions[currentQuestion]._id}`}
                  checked={selectedAnswers[quiz.Questions[currentQuestion]._id] === response._id}
                  onChange={() => handleAnswerSelect(quiz.Questions[currentQuestion]._id, response._id)}
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
                Précédent
              </Button>
              {currentQuestion < quiz.Questions.length - 1 ? (
                <Button
                  variant="primary"
                  onClick={() => setCurrentQuestion(prev => prev + 1)}
                  disabled={!selectedAnswers[quiz.Questions[currentQuestion]._id]}
                >
                  Suivant
                </Button>
              ) : (
                <Button
                  variant="success"
                  onClick={handleSubmit}
                  disabled={
                    submitting ||
                    !selectedAnswers[quiz.Questions[currentQuestion]._id] ||
                    Object.keys(selectedAnswers).length !== quiz.Questions.length
                  }
                >
                  {submitting ? 'Soumission en cours...' : 'Soumettre le quiz'}
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>
      ) : (
        <Spinner animation="border" className="mt-4" />
      )}
    </Container>
  );
};

export default QuizView;
