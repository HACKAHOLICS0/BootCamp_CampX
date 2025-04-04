import React, { useRef, useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

const InteractiveVideoPlayer = ({ videoUrl }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptionRef = useRef(''); // Pour stocker la transcription complète
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [lastQuestionTime, setLastQuestionTime] = useState(0);
  const questionIntervalRef = useRef(null);

  useEffect(() => {
    // Vérifier si la reconnaissance vocale est supportée
    if (!window.webkitSpeechRecognition) {
      console.error("La reconnaissance vocale n'est pas supportée par ce navigateur");
      return;
    }

    // Créer une nouvelle instance de reconnaissance vocale
    const SpeechRecognition = window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    // Configurer la reconnaissance vocale
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'fr-FR';

    // Gérer les résultats de la reconnaissance
    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        // Mettre à jour la transcription complète
        transcriptionRef.current += finalTranscript;
        setTranscription(transcriptionRef.current);
      }
    };

    // Gérer les erreurs
    recognitionRef.current.onerror = (event) => {
      console.error('Erreur de reconnaissance vocale:', event.error);
      setIsRecognizing(false);
    };

    // Gérer la fin de la reconnaissance
    recognitionRef.current.onend = () => {
      setIsRecognizing(false);
      // Redémarrer automatiquement si la vidéo est toujours en lecture
      if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
        try {
          recognitionRef.current.start();
          setIsRecognizing(true);
        } catch (error) {
          console.error('Erreur lors du redémarrage de la reconnaissance:', error);
        }
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleError = (e) => {
    console.error("Erreur de chargement de la vidéo:", e);
    setError("La vidéo n'a pas pu être chargée. Veuillez réessayer.");
  };

  const handleRetry = () => {
    if (videoRef.current) {
      videoRef.current.load();
      setError(null);
      // Réinitialiser la transcription
      transcriptionRef.current = '';
      setTranscription('');
    }
  };

  const handlePlay = () => {
    if (recognitionRef.current && !isRecognizing) {
      try {
        recognitionRef.current.start();
        setIsRecognizing(true);
      } catch (error) {
        console.error('Erreur lors du démarrage de la reconnaissance:', error);
      }
    }
  };

  const handlePause = () => {
    if (recognitionRef.current && isRecognizing) {
      try {
        recognitionRef.current.stop();
        setIsRecognizing(false);
      } catch (error) {
        console.error('Erreur lors de l\'arrêt de la reconnaissance:', error);
      }
    }
  };

  const transcriptionBoxRef = useRef(null);

  // Effet pour faire défiler automatiquement vers le bas
  useEffect(() => {
    if (transcriptionBoxRef.current) {
      transcriptionBoxRef.current.scrollTop = transcriptionBoxRef.current.scrollHeight;
    }
  }, [transcription]);

  // Fonction pour générer une question
  const generateQuestion = async () => {
    if (!transcriptionRef.current.trim()) {
      console.log("Pas de transcription disponible pour générer une question");
      return;
    }

    try {
      // Mettre la vidéo en pause avant de faire la requête
      if (videoRef.current) {
        videoRef.current.pause();
      }

      const response = await fetch('http://localhost:5000/api/questions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcriptionRef.current
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération de la question');
      }

      if (Array.isArray(data) && data.length > 0) {
        setCurrentQuestion(data[0]);
      } else {
        console.error('Aucune question générée');
        if (videoRef.current) {
          videoRef.current.play();
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
      // En cas d'erreur, reprendre la lecture
      if (videoRef.current) {
        videoRef.current.play();
      }
    }
  };

  // Vérifier périodiquement s'il faut générer une question
  useEffect(() => {
    const checkForQuestion = () => {
      if (videoRef.current && !videoRef.current.paused && !currentQuestion) {
        const currentTime = videoRef.current.currentTime;
        if (currentTime - lastQuestionTime >= 120) { // 120 secondes = 2 minutes
          console.log("Génération d'une question à", currentTime);
          generateQuestion();
          setLastQuestionTime(currentTime);
        }
      }
    };

    const intervalId = setInterval(checkForQuestion, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [lastQuestionTime, currentQuestion]);

  // Gérer la réponse à la question
  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowExplanation(true);
  };

  // Continuer la vidéo après la question
  const handleContinue = () => {
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setShowExplanation(false);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  if (!videoUrl) {
    return (
      <Box sx={{ 
        width: '100%',
        textAlign: 'center',
        p: 2
      }}>
        <Typography>Vidéo non disponible</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Box sx={{ position: 'relative', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
        <video
          ref={videoRef}
          style={{ 
            width: '100%',
            display: 'block'
          }}
          controls
          onError={handleError}
          onPlay={handlePlay}
          onPause={handlePause}
        >
          <source src="http://localhost:5000/uploads/videos/1743717333866.mp4" type="video/mp4" />
          Votre navigateur ne supporte pas la lecture des vidéos.
        </video>
        {error && (
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            p: 2,
            borderRadius: 1,
            textAlign: 'center'
          }}>
            <Typography>{error}</Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleRetry}
              sx={{ mt: 2 }}
            >
              Réessayer
            </Button>
          </Box>
        )}
      </Box>

      {/* Zone de transcription */}
      <Paper 
        ref={transcriptionBoxRef}
        elevation={3}
        sx={{
          mt: 2,
          p: 2,
          minHeight: '150px',
          maxHeight: '300px',
          overflowY: 'auto',
          bgcolor: 'background.paper',
          borderRadius: 1
        }}
      >
        <Typography variant="h6" gutterBottom>
          Transcription complète
        </Typography>
        <Typography 
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '1.1rem',
            lineHeight: 1.5
          }}
        >
          {transcription || 'La transcription apparaîtra pendant la lecture...'}
        </Typography>
      </Paper>

      {/* Dialog pour afficher la question */}
      <Dialog 
        open={!!currentQuestion} 
        onClose={() => {}}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Question sur le contenu</DialogTitle>
        <DialogContent>
          {currentQuestion && (
            <>
              <Typography variant="h6" gutterBottom>
                {currentQuestion.question}
              </Typography>
              <Box sx={{ mt: 2 }}>
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    variant={selectedAnswer === option ? "contained" : "outlined"}
                    onClick={() => handleAnswer(option)}
                    disabled={!!selectedAnswer}
                    sx={{ 
                      mb: 1, 
                      width: '100%',
                      textAlign: 'left',
                      backgroundColor: selectedAnswer === option && 
                                    option === currentQuestion.correct_answer ? 
                                    'success.light' : undefined
                    }}
                  >
                    {option}
                  </Button>
                ))}
              </Box>
              {showExplanation && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="body1" color={
                    selectedAnswer === currentQuestion.correct_answer ? 
                    "success.main" : "error.main"
                  }>
                    {selectedAnswer === currentQuestion.correct_answer ? 
                      "Correct !" : 
                      `Incorrect. La bonne réponse était : ${currentQuestion.correct_answer}`
                    }
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          {showExplanation && (
            <Button 
              onClick={handleContinue}
              variant="contained"
              color="primary"
            >
              Continuer la vidéo
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InteractiveVideoPlayer; 