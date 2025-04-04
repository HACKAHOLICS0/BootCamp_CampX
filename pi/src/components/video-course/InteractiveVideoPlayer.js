import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, Paper, IconButton, CircularProgress, Slider, LinearProgress } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ReplayIcon from '@mui/icons-material/Replay';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { generateQuestion, analyzeVideoContent } from '../../services/questionGenerator';


const InteractiveVideoPlayer = ({ videoUrl, videoTitle = "", onQuestionAnswered }) => {
  const videoRef = useRef(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [autoPauseInterval, setAutoPauseInterval] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoContent, setVideoContent] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastContent, setLastContent] = useState("");
  const [contentHistory, setContentHistory] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [lastQuestionTime, setLastQuestionTime] = useState(0);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [questionHistory, setQuestionHistory] = useState([]);
  const [currentSection, setCurrentSection] = useState(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showQuestion, setShowQuestion] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [videoContext, setVideoContext] = useState({
    content: '',
    contentType: 'general',
    keyPoints: [],
    timestamp: 0
  });

  // Fonction pour formater le temps en minutes:secondes
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Fonction pour gérer le son
  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  // Fonction pour gérer la lecture/pause
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch(error => {
              console.error("Erreur de lecture:", error);
            });
        }
      }
    }
  };

  // Fonction pour gérer la mise à jour du temps de la vidéo
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const currentTime = video.currentTime;
    
    // Mettre à jour la section courante
    const newSection = videoContent.find(section => 
      currentTime >= section.startTime && currentTime <= section.endTime
    );

    if (newSection && (!currentSection || newSection.startTime !== currentSection.startTime)) {
      setCurrentSection(newSection);
      // Générer une question quand on change de section
      if (!currentQuestion) {
      generateQuestion(currentTime);
      }
    }

    const progress = (currentTime / video.duration) * 100;
    setVideoProgress(progress);

    // Générer une question toutes les 2 minutes si on est dans la même section
    if (currentTime - lastQuestionTime >= 120 && currentSection && !currentQuestion) {
      generateQuestion(currentTime);
      setLastQuestionTime(currentTime);
    }

    setCurrentTime(currentTime);
    setDuration(video.duration);

    // Mettre à jour la transcription en fonction du temps
    updateTranscription(currentTime);
  };

  // Fonction pour mettre à jour la transcription
  const updateTranscription = (time) => {
    // Ici, vous pouvez ajouter la logique pour mettre à jour la transcription
    // en fonction du temps de la vidéo
   // const newTranscription = `Transcription à ${formatTime(time)}`;
  //  setTranscription(newTranscription);
  };

  // Fonction pour gérer le changement de position dans la vidéo
  const handleSeek = (event, newValue) => {
    if (videoRef.current) {
      const newTime = (newValue / 100) * duration;
      videoRef.current.currentTime = newTime;
      setVideoProgress(newValue);
      updateTranscription(newTime);
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      analyzeVideo();
    }
  }, [videoUrl]);

  const analyzeVideo = async () => {
    setIsAnalyzing(true);
    try {
      const duration = videoRef.current.duration;
      const sections = [];
      const sectionDuration = 30;

      for (let startTime = 0; startTime < duration; startTime += sectionDuration) {
        const endTime = Math.min(startTime + sectionDuration, duration);
        sections.push({
          startTime,
          endTime,
          content: "",
          keyPoints: []
        });
      }

      setVideoContent(sections);
    } catch (error) {
      console.error('Erreur lors de l\'analyse de la vidéo:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Configurer les pauses automatiques toutes les 2 minutes
    const interval = setInterval(() => {
      if (video && !currentQuestion && isPlaying) {
        const currentTime = video.currentTime;
        if (currentTime - lastQuestionTime >= 120) { // 120 secondes = 2 minutes
          console.log('Pause automatique après 2 minutes:', currentTime);
          video.pause();
          generateQuestion(currentTime);
          setLastQuestionTime(currentTime);
        }
      }
    }, 1000);

    setAutoPauseInterval(interval);

    // Ajouter l'écouteur d'événements timeupdate
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      clearInterval(interval);
    };
  }, [videoContent, currentQuestion, isPlaying, lastContent, lastQuestionTime]);

  // Ajouter un useEffect pour gérer la pause
  useEffect(() => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(error => {
          console.error("Erreur de lecture:", error);
        });
        setIsPlaying(true);
      }
    }
  }, [isPaused]);

  const generateQuestion = async (timestamp) => {
    if (isLoading || currentQuestion) return;
    setIsLoading(true);
    try {
      const videoContext = {
        timestamp,
        videoUrl,
        section: currentSection,
        lastContent: contentHistory.slice(-3),
        duration: duration,
        currentTime: currentTime
      };

      const data = await generateQuestion(videoContext);
      
      if (data && data.question) {
        setCurrentQuestion(data.question);
        setQuestionHistory(prev => [...prev, data.question]);
        setIsPaused(true);
      }
    } catch (error) {
      console.error('Erreur lors de la génération de la question:', error);
      // En cas d'erreur, générer une question par défaut
      const defaultQuestion = {
        text: `Question sur le contenu à ${Math.floor(timestamp / 60)}:${(timestamp % 60).toString().padStart(2, '0')}`,
        options: ["Vrai", "Faux", "Je ne sais pas", "Aucune de ces réponses"],
        correctAnswer: "Vrai",
        explanation: `Cette question teste votre compréhension du contenu à ${Math.floor(timestamp / 60)}:${(timestamp % 60).toString().padStart(2, '0')}`
      };
      setCurrentQuestion(defaultQuestion);
      setIsPaused(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowCorrectAnswer(true);
    setShowExplanation(true);
    
    // Désactiver les boutons de réponse après la sélection
    const buttons = document.querySelectorAll('.answer-button');
    buttons.forEach(button => {
      button.disabled = true;
      if (button.textContent === currentQuestion.correctAnswer) {
        button.style.backgroundColor = '#4caf50';
        button.style.color = 'white';
      }
    });

    if (onQuestionAnswered) {
      onQuestionAnswered(answer, currentQuestion);
    }
  };

  const handleContinue = () => {
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setShowCorrectAnswer(false);
    setIsPaused(false);
    
    // Réactiver les boutons de réponse
    const buttons = document.querySelectorAll('.answer-button');
    buttons.forEach(button => {
      button.disabled = false;
      button.style.backgroundColor = '';
      button.style.color = '';
    });
  };

  const restartVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(error => {
        console.error("Erreur de lecture:", error);
      });
      setIsPlaying(true);
      setCurrentQuestion(null);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setShowCorrectAnswer(false);
      setIsPaused(false);
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error("Erreur de lecture:", error);
      });
      setIsPlaying(true);
    }
  };

  // Fonction pour extraire les points clés de la transcription
  const extractKeyPoints = (text) => {
    if (!text || text.trim() === '') return [];
    
    // Nettoyer le texte
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    
    // Diviser le texte en phrases
    const sentences = cleanedText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Filtrer les phrases importantes
    const keyPoints = sentences.filter(sentence => {
      const lowerSentence = sentence.toLowerCase();
      return (
        lowerSentence.includes('important') ||
        lowerSentence.includes('clé') ||
        lowerSentence.includes('essentiel') ||
        lowerSentence.includes('étape') ||
        lowerSentence.includes('conseil') ||
        lowerSentence.includes('astuce') ||
        lowerSentence.includes('note') ||
        lowerSentence.includes('attention') ||
        lowerSentence.includes('remarque')
      );
    });
    
    // Si aucune phrase importante n'est trouvée, prendre les 3 premières phrases
    if (keyPoints.length === 0 && sentences.length > 0) {
      return sentences.slice(0, 3);
    }
    
    return keyPoints;
  };

  // Gestion de la transcription et génération de questions
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let transcriptionInterval;
    let questionInterval;
    let isGeneratingQuestion = false;
    let lastQuestionTime = 0;
    let fullTranscription = '';
    let transcriptionStartTime = 0;
    let questionGenerationTimeout = null;

    const handleTranscription = async () => {
      try {
        const content = await analyzeVideoContent(video, currentTime, (newTranscription) => {
          if (newTranscription && newTranscription.trim() !== '') {
            const cleanedTranscription = newTranscription.replace(/\s+/g, ' ').trim();
            fullTranscription = cleanedTranscription;
            setTranscription(fullTranscription);
            setVideoContext(prevContext => ({
              ...prevContext,
              content: fullTranscription,
              timestamp: currentTime
            }));
          }
        });
      } catch (error) {
        console.error('Erreur de transcription:', error);
      }
    };

    const generateQuestionFromTranscription = async () => {
      if (!fullTranscription || isGeneratingQuestion) return;
      
      const timeSinceLastQuestion = currentTime - lastQuestionTime;
      if (timeSinceLastQuestion < 120) return;
      
      try {
        isGeneratingQuestion = true;
        
        const questionContext = {
          content: fullTranscription,
          contentType: 'general',
          keyPoints: extractKeyPoints(fullTranscription),
          timestamp: currentTime
        };

        const result = await generateQuestion(questionContext);
        
        if (result && result.question) {
          setCurrentQuestion(result.question);
          setShowQuestion(true);
          lastQuestionTime = currentTime;
          video.pause();
          setIsPlaying(false);
          
          // Réinitialiser la transcription pour la prochaine période
          fullTranscription = '';
          setTranscription('');
          transcriptionStartTime = currentTime;
        }
      } catch (error) {
        console.error('Erreur lors de la génération de la question:', error);
      } finally {
        isGeneratingQuestion = false;
      }
    };

    const checkAndGenerateQuestion = () => {
      if (isPlaying && !showQuestion && !isGeneratingQuestion) {
        const timeSinceTranscriptionStart = currentTime - transcriptionStartTime;
        if (timeSinceTranscriptionStart >= 120) {
          generateQuestionFromTranscription();
        }
      }
    };

    const handlePlay = () => {
      if (!isPlaying) return;
      
      // Réinitialiser la transcription au début de la lecture
      fullTranscription = '';
      setTranscription('');
      transcriptionStartTime = currentTime;
      handleTranscription();
      
      // Mettre à jour la transcription toutes les secondes
      transcriptionInterval = setInterval(() => {
        if (isPlaying) {
          handleTranscription();
        }
      }, 1000);

      // Vérifier toutes les secondes si 2 minutes se sont écoulées
      questionInterval = setInterval(checkAndGenerateQuestion, 1000);
    };

    const handlePause = () => {
      if (transcriptionInterval) {
        clearInterval(transcriptionInterval);
      }
      if (questionInterval) {
        clearInterval(questionInterval);
      }
      if (questionGenerationTimeout) {
        clearTimeout(questionGenerationTimeout);
      }
    };

    if (isPlaying) {
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
    }

    return () => {
      if (isPlaying) {
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
      }
      if (transcriptionInterval) {
        clearInterval(transcriptionInterval);
      }
      if (questionInterval) {
        clearInterval(questionInterval);
      }
      if (questionGenerationTimeout) {
        clearTimeout(questionGenerationTimeout);
      }
    };
  }, [currentTime, isPlaying, showQuestion]);

  if (!videoUrl) {
    return (
      <Box sx={{ 
        width: '100%',
        position: 'relative',
        paddingTop: '56.25%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography>Vidéo non disponible</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Box sx={{ position: 'relative' }}>
        <video
          ref={videoRef}
          src={videoUrl}
          style={{ width: '100%', borderRadius: '8px' }}
          controls
          playsInline
        />
        {isLoading && (
          <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
        )}
      </Box>

      {/* Contrôles vidéo */}
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
        <IconButton onClick={handlePlayPause}>
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>
        <IconButton onClick={handleMute}>
          {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
        </IconButton>
        <Typography variant="body2" sx={{ mx: 2 }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </Typography>
        <Slider
          value={videoProgress}
          onChange={handleSeek}
          sx={{ flex: 1, mx: 2 }}
        />
      </Box>

      {/* Transcription */}
      <Box sx={{ 
        mt: 2, 
        p: 2, 
        bgcolor: 'background.paper', 
        borderRadius: 1,
        maxHeight: '200px',
        overflowY: 'auto',
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="h6" gutterBottom>
          Transcription
        </Typography>
        <Typography variant="body1">
          {transcription}
        </Typography>
      </Box>

      {/* Question */}
      {currentQuestion && (
        <Dialog 
          open={!!currentQuestion} 
          onClose={() => {}}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Question sur le contenu</DialogTitle>
          <DialogContent>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              {currentQuestion.text}
            </Typography>
            <Box sx={{ mt: 2 }}>
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  className="answer-button"
                  variant={selectedAnswer === option ? "contained" : "outlined"}
                  onClick={() => handleAnswer(option)}
                  disabled={!!selectedAnswer}
                  sx={{ 
                    mb: 1, 
                    width: '100%', 
                    textAlign: 'left',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: !selectedAnswer ? 'action.hover' : 'inherit',
                    }
                  }}
                >
                  {option}
                </Button>
              ))}
            </Box>
            {showCorrectAnswer && (
              <Typography
                variant="body1"
                color={selectedAnswer === currentQuestion.correctAnswer ? "success.main" : "error.main"}
                sx={{ mt: 2, fontWeight: 'bold' }}
              >
                {selectedAnswer === currentQuestion.correctAnswer
                  ? "✓ Correct !"
                  : `✗ Incorrect. La bonne réponse est : ${currentQuestion.correctAnswer}`}
              </Typography>
            )}
            {showExplanation && (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mt: 2,
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 1
                }}
              >
                {currentQuestion.explanation}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleContinue}
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              Continuer la vidéo
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Indicateur de chargement */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default InteractiveVideoPlayer; 