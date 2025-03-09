import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import './QuizStyle.css';

const QuizView = () => {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const token = Cookies.get('token');
        const response = await axios.get(`http://localhost:5001/api/quizzes/${quizId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuiz(response.data);
        setTimeLeft(response.data.timeLimit * 60); // Convert minutes to seconds
        setLoading(false);
      } catch (error) {
        setError('Failed to load quiz');
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    let timer;
    if (quizStarted && timeLeft > 0 && !quizFinished) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            finishQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizStarted, timeLeft, quizFinished]);

  const startQuiz = () => {
    setQuizStarted(true);
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const finishQuiz = async () => {
    setQuizFinished(true);
    let correctAnswers = 0;
    
    quiz.questions.forEach((question, index) => {
      const selectedAnswer = selectedAnswers[index];
      if (selectedAnswer !== undefined && 
          question.options[selectedAnswer].isCorrect) {
        correctAnswers += question.points;
      }
    });
    
    setScore(correctAnswers);

    try {
      const token = Cookies.get('token');
      await axios.post(`http://localhost:5001/api/quizzes/${quizId}/submit`, {
        answers: selectedAnswers,
        timeSpent: quiz.timeLimit * 60 - timeLeft,
        score: correctAnswers
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to submit quiz results:', error);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="quiz-loading">Loading quiz...</div>;
  if (error) return <div className="quiz-error">{error}</div>;
  if (!quiz) return <div className="quiz-error">Quiz not found</div>;

  return (
    <div className="quiz-container">
      {!quizStarted ? (
        <div className="quiz-intro">
          <h2>{quiz.title}</h2>
          <p>{quiz.description}</p>
          <div className="quiz-info">
            <span>Time Limit: {quiz.timeLimit} minutes</span>
            <span>Questions: {quiz.questions.length}</span>
            <span>Total Points: {quiz.questions.reduce((sum, q) => sum + q.points, 0)}</span>
          </div>
          <button className="start-quiz-btn" onClick={startQuiz}>
            Start Quiz
          </button>
        </div>
      ) : (
        <div className="quiz-content">
          <div className="quiz-header">
            <div className="quiz-progress">
              <div className="progress-bar">
                <div 
                  className="progress" 
                  style={{ width: `${(currentQuestion + 1) / quiz.questions.length * 100}%` }}
                ></div>
              </div>
              <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
            </div>
            <div className="quiz-timer">
              Time Left: {formatTime(timeLeft)}
            </div>
          </div>

          {!quizFinished ? (
            <div className="question-container">
              <h3>{quiz.questions[currentQuestion].question}</h3>
              <div className="options-grid">
                {quiz.questions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    className={`option-btn ${selectedAnswers[currentQuestion] === index ? 'selected' : ''}`}
                    onClick={() => handleAnswerSelect(currentQuestion, index)}
                  >
                    {option.text}
                  </button>
                ))}
              </div>
              <div className="navigation-buttons">
                {currentQuestion > 0 && (
                  <button
                    className="nav-btn"
                    onClick={() => setCurrentQuestion(prev => prev - 1)}
                  >
                    Previous
                  </button>
                )}
                {currentQuestion < quiz.questions.length - 1 ? (
                  <button
                    className="nav-btn"
                    onClick={() => setCurrentQuestion(prev => prev + 1)}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    className="finish-btn"
                    onClick={finishQuiz}
                  >
                    Finish Quiz
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="quiz-results">
              <h2>Quiz Complete!</h2>
              <div className="score-display">
                <div className="score-circle">
                  <span className="score-number">{score}</span>
                  <span className="score-label">points</span>
                </div>
              </div>
              <div className="results-details">
                <p>Time Spent: {formatTime(quiz.timeLimit * 60 - timeLeft)}</p>
                <p>Questions Answered: {Object.keys(selectedAnswers).length}/{quiz.questions.length}</p>
              </div>
            </div>
          )}

          {!quizFinished && (
            <div className="question-navigator">
              {quiz.questions.map((_, index) => (
                <button
                  key={index}
                  className={`question-dot ${currentQuestion === index ? 'active' : ''} ${selectedAnswers[index] !== undefined ? 'answered' : ''}`}
                  onClick={() => setCurrentQuestion(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizView;
