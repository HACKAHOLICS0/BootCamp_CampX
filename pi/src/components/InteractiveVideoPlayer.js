import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Typography, Button, RadioGroup, Radio, FormControlLabel, FormControl } from '@mui/material';

const InteractiveVideoPlayer = ({ video }) => {
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };
  }, []);

  const handleTimeUpdate = () => {
    const currentTime = videoRef.current.currentTime;
    setCurrentTime(currentTime);

    // Check if we need to show a quiz
    const nextQuiz = video.quiz.find(q => 
      q.timestamp <= currentTime && 
      !quizAnswered && 
      !showQuiz
    );

    if (nextQuiz) {
      setCurrentQuiz(nextQuiz);
      setShowQuiz(true);
      videoRef.current.pause();
    }
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswer === currentQuiz.answer) {
      setScore(score + currentQuiz.points);
    }
    setQuizAnswered(true);
    setShowQuiz(false);
    setSelectedAnswer('');
    videoRef.current.play();
  };

  const handleContinue = () => {
    setShowQuiz(false);
    setQuizAnswered(true);
    setSelectedAnswer('');
    videoRef.current.play();
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
      <video
        ref={videoRef}
        controls
        width="100%"
        src={video.videoUrl}
        style={{ marginBottom: '20px' }}
      />

      {showQuiz && (
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Question
          </Typography>
          <Typography variant="body1" gutterBottom>
            {currentQuiz.question}
          </Typography>
          <FormControl component="fieldset">
            <RadioGroup
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
            >
              {currentQuiz.options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
          </FormControl>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAnswerSubmit}
              disabled={!selectedAnswer}
            >
              Submit Answer
            </Button>
          </Box>
        </Paper>
      )}

      {quizAnswered && currentQuiz && (
        <Paper sx={{ p: 3, mt: 2, bgcolor: 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            {selectedAnswer === currentQuiz.answer ? 'Correct!' : 'Incorrect'}
          </Typography>
          <Typography variant="body1" gutterBottom>
            {currentQuiz.explanation}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleContinue}
            sx={{ mt: 2 }}
          >
            Continue Video
          </Button>
        </Paper>
      )}

      <Typography variant="h6" sx={{ mt: 2 }}>
        Score: {score}
      </Typography>
    </Box>
  );
};

export default InteractiveVideoPlayer; 