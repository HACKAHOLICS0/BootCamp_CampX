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
  const [timeLeft, setTimeLeft] = useState(0);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState(null);
  const [answerTimes, setAnswerTimes] = useState({});
  const [questionStartTime, setQuestionStartTime] = useState(null);
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

        const response = await axios.get(`${config.API_URL}/api/auth/profile/${parsedUser.id}`);

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

  // Récupérer le quiz
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        console.log("Fetching quiz with ID:", quizId);
        const token = Cookies.get('token');
        if (!token) {
          setError("Token non trouvé. Veuillez vous reconnecter.");
          return;
        }

        const response = await axios.get(`${config.API_URL}/api/quiz/${quizId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Quiz data received:", response.data);

        if (!response.data) {
          throw new Error('Aucune donnée de quiz reçue');
        }

        // Normaliser les données du quiz
        const normalizedQuiz = {
          ...response.data,
          title: response.data.title || response.data.nom || 'Quiz sans titre',
          Questions: Array.isArray(response.data.questions) ? response.data.questions : 
                    Array.isArray(response.data.Questions) ? response.data.Questions : []
        };

        if (normalizedQuiz.Questions.length === 0) {
          throw new Error('Aucune question trouvée dans ce quiz');
        }

        // S'assurer que chaque question a le bon format
        normalizedQuiz.Questions = normalizedQuiz.Questions.map(q => ({
          _id: q._id,
          texte: q.texte || q.text || q.question || 'Question sans texte',
          Responses: Array.isArray(q.Responses) ? q.Responses :
                    Array.isArray(q.responses) ? q.responses.map(r => ({
                      _id: r._id,
                      texte: r.texte || r.text || r.response || 'Réponse sans texte'
                    })) : []
        }));

        console.log("Normalized quiz data:", normalizedQuiz);
        setQuiz(normalizedQuiz);
        setTimeLeft((normalizedQuiz.chronoVal || normalizedQuiz.duration || 10) * 60);
        setLoading(false);
      } catch (error) {
        console.error("Error loading quiz:", error);
        setError(error.message || "Erreur lors du chargement du quiz");
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  // Initialiser le temps de début du quiz
  useEffect(() => {
    if (quiz && !startTime) {
      setStartTime(Date.now());
    }
  }, [quiz, startTime]);

  // Gérer le timer du quiz
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

  // Mettre à jour le temps de début de la question courante
  useEffect(() => {
    if (quiz && quiz.Questions && quiz.Questions[currentQuestion]) {
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestion, quiz]);

  const handleAnswerSelect = (questionId, answerId) => {
    if (!questionStartTime) return;

    const currentTime = Date.now();
    const timeSpent = Math.floor((currentTime - questionStartTime) / 1000);
    
    setAnswerTimes(prev => ({
      ...prev,
      [questionId]: timeSpent
    }));

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
      const token = Cookies.get('token');
      const totalTimeSpent = Math.floor((Date.now() - startTime) / 1000);

      // Vérifier que toutes les questions ont une réponse
      const unansweredQuestions = quiz.Questions.filter(
        q => !selectedAnswers[q._id]
      );

      if (unansweredQuestions.length > 0) {
        setError('Veuillez répondre à toutes les questions avant de soumettre.');
        setSubmitting(false);
        return;
      }

      console.log("Submitting quiz with data:", {
        answers: selectedAnswers,
        answerTimes,
        timeSpent: totalTimeSpent
      });

      const response = await axios.post(`${config.API_URL}/api/quiz/submit/${quizId}`, {
        answers: selectedAnswers,
        answerTimes,
        timeSpent: totalTimeSpent
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Quiz submission response:", response.data);
      navigate(`/quiz/${quizId}/result`, { state: { result: response.data } });
    } catch (err) {
      console.error("Quiz submission error:", err);
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
        <Button 
          variant="primary" 
          className="mt-3"
          onClick={() => navigate(-1)}
        >
          Retour
        </Button>
      </Container>
    );
  }

  if (!verificationComplete) {
    return (
      <Container>
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
      </Container>
    );
  }

  if (loading || !quiz || !quiz.Questions) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" />
          <p>Chargement du quiz...</p>
          <small className="text-muted">Veuillez patienter pendant le chargement des questions.</small>
        </div>
      </Container>
    );
  }

  const currentQuestionData = quiz.Questions[currentQuestion];
  if (!currentQuestionData) {
    return (
      <Container>
        <Alert variant="danger">
          <Alert.Heading>Erreur</Alert.Heading>
          <p>Question non trouvée. Veuillez réessayer ou contacter l'administrateur.</p>
          <hr />
          <p className="mb-0">
            {`Question ${currentQuestion + 1}/${quiz.Questions.length}`}
          </p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
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

          <Card.Title className="question-text">
            {currentQuestionData.texte}
          </Card.Title>

          <Form>
            {Array.isArray(currentQuestionData.Responses) && currentQuestionData.Responses.map(response => (
              <Form.Check
                key={response._id}
                type="radio"
                id={response._id}
                label={response.texte}
                name={`question-${currentQuestionData._id}`}
                checked={selectedAnswers[currentQuestionData._id] === response._id}
                onChange={() => handleAnswerSelect(currentQuestionData._id, response._id)}
                className="response-option mb-2"
              />
            ))}
            {(!currentQuestionData.Responses || currentQuestionData.Responses.length === 0) && (
              <Alert variant="warning">
                Aucune réponse disponible pour cette question.
              </Alert>
            )}
          </Form>

          <div className="navigation-buttons mt-4 d-flex justify-content-between">
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
                disabled={!selectedAnswers[currentQuestionData._id]}
              >
                Suivant
              </Button>
            ) : (
              <Button
                variant="success"
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !selectedAnswers[currentQuestionData._id] ||
                  Object.keys(selectedAnswers).length !== quiz.Questions.length
                }
              >
                {submitting ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Soumission en cours...
                  </>
                ) : (
                  'Soumettre le quiz'
                )}
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default QuizView;