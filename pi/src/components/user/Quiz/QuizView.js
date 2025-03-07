import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import './QuizView.css';

const backendURL = "http://localhost:5000/api";

const QuizView = () => {
  const { quizId, courseId } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [results, setResults] = useState(null);
  const [startTime, setStartTime] = useState(null);

  // Récupérer les informations de l'utilisateur
  const user = Cookies.get('user') ? JSON.parse(Cookies.get('user')) : null;

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${backendURL}/quiz/student/${quizId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch quiz');
        }
        
        const data = await response.json();
        console.log('Fetched quiz:', data);
        setQuiz(data);
        
        // Initialiser le timer si le quiz a une limite de temps
        if (data.chronoVal) {
          setTimeLeft(data.chronoVal * 60); // Convertir en secondes
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

  // Gestion du timer
  useEffect(() => {
    let timer;
    if (quizStarted && timeLeft !== null && timeLeft > 0 && !quizFinished) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            submitQuiz(); // Soumettre automatiquement à la fin du temps
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [quizStarted, timeLeft, quizFinished]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setStartTime(new Date());
  };

  const handleAnswerSelect = (questionId, answerId) => {
    setAnswers({
      ...answers,
      [questionId]: answerId
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.Questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitQuiz = async () => {
    try {
      const endTime = new Date();
      const timeSpent = Math.floor((endTime - startTime) / 1000); // en secondes
      
      const response = await fetch(`${backendURL}/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId,
          answers,
          timeSpent,
          userId: user?._id || user?.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }
      
      const result = await response.json();
      console.log('Quiz result:', result);
      setResults(result);
      setQuizFinished(true);
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setError(error.message);
    }
  };

  const renderQuestion = (question) => {
    return (
      <div className="question-container">
        <h3 className="question-text">{question.texte}</h3>
        
        {question.code && (
          <div className="code-block">
            <pre>
              <code className={question.language || 'javascript'}>
                {question.code}
              </code>
            </pre>
          </div>
        )}
        
        <div className="responses-container">
          {question.Responses && question.Responses.map((response) => (
            <div 
              key={response._id} 
              className={`response-option ${answers[question._id] === response._id ? 'selected' : ''}`}
              onClick={() => handleAnswerSelect(question._id, response._id)}
            >
              <span className="response-text">{response.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    return (
      <div className="results-container">
        <h2>Quiz Results</h2>
        <div className="result-summary">
          <p>Your score: <span className="score">{results.score}/{results.totalQuestions}</span></p>
          <p>Percentage: <span className="percentage">{results.percentage.toFixed(2)}%</span></p>
          <p>Time spent: {Math.floor(results.timeSpent / 60)}m {results.timeSpent % 60}s</p>
        </div>
        
        <button className="return-button" onClick={() => courseId ? navigate(`/courses/${courseId}`) : navigate('/courses')}>
          Return to Course
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="quiz-loading">
        <div className="spinner"></div>
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-error">
        <h3>Error loading quiz</h3>
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="quiz-not-found">
        <h3>Quiz Not Found</h3>
        <p>The quiz you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  if (quizFinished && results) {
    return renderResults();
  }

  return (
    <div className="quiz-view-container">
      {!quizStarted ? (
        <div className="quiz-intro">
          <h1>{quiz.title}</h1>
          <div className="quiz-info">
            <p><strong>Number of questions:</strong> {quiz.Questions.length}</p>
            {quiz.chronoVal && (
              <p><strong>Time limit:</strong> {quiz.chronoVal} minutes</p>
            )}
          </div>
          <button className="start-quiz-btn" onClick={handleStartQuiz}>
            Start Quiz
          </button>
        </div>
      ) : (
        <>
          <div className="quiz-header">
            <h2>{quiz.title}</h2>
            {timeLeft !== null && (
              <div className="timer">
                Time remaining: {formatTime(timeLeft)}
              </div>
            )}
            <div className="question-progress">
              Question {currentQuestionIndex + 1} of {quiz.Questions.length}
            </div>
          </div>
          
          <div className="quiz-body">
            {quiz.Questions && quiz.Questions.length > 0 && 
              renderQuestion(quiz.Questions[currentQuestionIndex])
            }
          </div>
          
          <div className="quiz-navigation">
            <button 
              className="nav-btn prev"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </button>
            
            {currentQuestionIndex < quiz.Questions.length - 1 ? (
              <button 
                className="nav-btn next"
                onClick={handleNextQuestion}
              >
                Next
              </button>
            ) : (
              <button 
                className="nav-btn submit"
                onClick={submitQuiz}
              >
                Submit Quiz
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default QuizView;