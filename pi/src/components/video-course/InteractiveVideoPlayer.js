import React, { useRef, useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

// Language options mapping
const LANGUAGE_CODES = {
  'en': 'en-US',
  'fr': 'fr-FR',
  'es': 'es-ES',
  'de': 'de-DE',
  'it': 'it-IT',
  'pt': 'pt-PT'
};

const InteractiveVideoPlayer = ({ videoUrl, videoTitle, language = 'en' }) => {
  const videoRef = useRef(null);
  const transcriptionBoxRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transcription, setTranscription] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptionRef = useRef('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [lastQuestionTime, setLastQuestionTime] = useState(0);
  const questionIntervalRef = useRef(null);
  const [micPermission, setMicPermission] = useState(false);

  // Request microphone permission and initialize speech recognition
  const initializeSpeechRecognition = async () => {
    try {
      // First, request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the stream after getting permission
      setMicPermission(true);

      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.log("Speech recognition not supported");
        return;
      }

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = LANGUAGE_CODES[language] || 'en-US';

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        setIsRecognizing(true);
      };

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
          console.log('Received transcript:', finalTranscript);
          transcriptionRef.current += finalTranscript;
          setTranscription(prev => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.log('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError("Veuillez autoriser l'accès au microphone pour la transcription");
          setMicPermission(false);
        }
        setIsRecognizing(false);
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsRecognizing(false);
        if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended && micPermission) {
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.log('Error restarting recognition:', error);
          }
        }
      };

    } catch (error) {
      console.log('Error initializing speech recognition:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setError("L'accès au microphone est nécessaire pour la transcription. Veuillez l'autoriser dans les paramètres de votre navigateur.");
        setMicPermission(false);
      }
    }
  };

  // Initialize on component mount
  useEffect(() => {
    initializeSpeechRecognition();
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.log('Error stopping recognition:', error);
        }
      }
    };
  }, []);

  // Handle video events
  const handlePlay = async () => {
    if (!micPermission) {
      await initializeSpeechRecognition();
    }
    
    if (recognitionRef.current && !isRecognizing && micPermission) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.log('Error starting recognition:', error);
      }
    }
  };

  const handlePause = () => {
    if (recognitionRef.current && isRecognizing) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log('Error stopping recognition:', error);
      }
    }
  };

  const handleError = (e) => {
    console.error("Video loading error:", e);
    setError("La vidéo n'a pas pu être chargée. Veuillez réessayer.");
    setIsLoading(false);
  };

  const handleLoadedData = () => {
    setIsLoading(false);
    setError(null);
  };

  // Auto-scroll transcription
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
      <div className="video-error">
        <p>Aucune vidéo sélectionnée</p>
      </div>
    );
  }

  return (
    <div className="video-player">
      {isLoading && (
        <div className="video-loading">
          <p>Chargement de la vidéo...</p>
        </div>
      )}
      {error && (
        <div className="video-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Réessayer
          </button>
        </div>
      )}
      <video
        ref={videoRef}
        controls
        width="100%"
        onError={handleError}
        onLoadedData={handleLoadedData}
        onPlay={handlePlay}
        onPause={handlePause}
        crossOrigin="anonymous"
        playsInline
      >
        <source 
          src={videoUrl} 
          type="video/mp4"
        />
        Votre navigateur ne supporte pas la lecture des vidéos.
      </video>

      {/* Transcription section */}
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
          Transcription en direct
        </Typography>
        {!micPermission ? (
          <Typography 
            variant="body2" 
            color="error" 
            sx={{ mb: 1 }}
          >
            L'accès au microphone est nécessaire pour la transcription. 
            <Button 
              onClick={initializeSpeechRecognition}
              color="primary"
              size="small"
              sx={{ ml: 1 }}
            >
              Autoriser le microphone
            </Button>
          </Typography>
        ) : isRecognizing ? (
          <Typography 
            variant="body2" 
            color="success.main" 
            sx={{ mb: 1 }}
          >
            Transcription en cours...
          </Typography>
        ) : (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ mb: 1 }}
          >
            La transcription démarrera avec la lecture de la vidéo
          </Typography>
        )}
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
    </div>
  );
};

export default InteractiveVideoPlayer; 