import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import WarningIcon from '@mui/icons-material/Warning';
import LockIcon from '@mui/icons-material/Lock';
// Import de face-api.js supprimé pour éviter les erreurs
import './AttentionStyles.css';

const CameraRequiredVideoPlayer = ({ videoUrl, videoTitle, onVideoReady, children }) => {
  // Références
  const videoRef = useRef(null);
  const cameraRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const inattentiveTimeoutRef = useRef(null);
  const modelsLoadedRef = useRef(false);

  // États
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [showCameraDialog, setShowCameraDialog] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Chargement des modèles de détection...');
  const [isAttentive, setIsAttentive] = useState(true);
  const [attentionLevel, setAttentionLevel] = useState(100);
  const [showWarning, setShowWarning] = useState(false);
  const [inattentiveCount, setInattentiveCount] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inattentionReason, setInattentionReason] = useState('');
  const [error, setError] = useState(null);

  // Constantes
  const INATTENTIVE_THRESHOLD = 3; // Nombre de détections inattentives avant de pauser la vidéo
  const WARNING_TIMEOUT = 5000; // Durée d'affichage de l'avertissement en ms

  // Initialisation sans chargement des modèles de détection faciale
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log("⚠️ Fonctionnalité de détection faciale désactivée");
        setLoadingMessage('Initialisation...');

        // Simuler un chargement pour une meilleure expérience utilisateur
        setTimeout(() => {
          modelsLoadedRef.current = true;
          setLoadingMessage('Initialisation terminée. Veuillez activer votre caméra.');
          setIsLoading(false);
        }, 1000);
      } catch (err) {
        console.error("❌ Erreur lors de l'initialisation:", err);
        setError("Une erreur est survenue lors de l'initialisation. Veuillez rafraîchir la page.");
        setIsLoading(false);
      }
    };

    initialize();

    // Nettoyage
    return () => {
      stopCamera();
      clearDetectionInterval();
    };
  }, []);

  // Démarrer la caméra
  const startCamera = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage('Activation de la caméra...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        }
      });

      if (cameraRef.current) {
        cameraRef.current.srcObject = stream;
        cameraStreamRef.current = stream;

        cameraRef.current.onloadedmetadata = () => {
          cameraRef.current.play();
          setCameraActive(true);
          setShowCameraDialog(false);
          setIsLoading(false);

          // Créer le canvas pour la détection
          if (!canvasRef.current && cameraRef.current.parentNode) {
            const canvas = document.createElement('canvas');
            canvas.width = cameraRef.current.videoWidth;
            canvas.height = cameraRef.current.videoHeight;
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvasRef.current = canvas;
            cameraRef.current.parentNode.appendChild(canvas);
          }

          // Démarrer la détection
          startDetection();
        };
      }
    } catch (err) {
      console.error("❌ Erreur d'accès à la caméra:", err);
      setCameraPermissionDenied(true);
      setError("Impossible d'accéder à la caméra. Veuillez vérifier les permissions de votre navigateur.");
      setIsLoading(false);
    }
  };

  // Arrêter la caméra
  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }

    if (cameraRef.current) {
      cameraRef.current.srcObject = null;
    }

    if (canvasRef.current && canvasRef.current.parentNode) {
      canvasRef.current.parentNode.removeChild(canvasRef.current);
      canvasRef.current = null;
    }

    setCameraActive(false);
    clearDetectionInterval();
  };

  // Démarrer la détection faciale
  const startDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    // Utiliser requestAnimationFrame pour une détection plus fluide
    setIsProcessing(false);
    detectFace();
  };

  // Arrêter la détection faciale
  const clearDetectionInterval = () => {
    // Arrêter la boucle de détection
    setIsProcessing(true);

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    if (inattentiveTimeoutRef.current) {
      clearTimeout(inattentiveTimeoutRef.current);
      inattentiveTimeoutRef.current = null;
    }
  };

  // Détecter le visage en utilisant l'API Canvas pour l'analyse d'image
  const detectFace = async () => {
    if (!cameraRef.current || !cameraActive || !modelsLoadedRef.current) return;

    try {
      // Utiliser Canvas pour analyser l'image de la webcam
      if (!canvasRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = cameraRef.current.videoWidth || 640;
        canvas.height = cameraRef.current.videoHeight || 480;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvasRef.current = canvas;
        cameraRef.current.parentNode.appendChild(canvas);
      }

      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Dessiner l'image de la webcam sur le canvas
      ctx.drawImage(cameraRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

      // Obtenir les données de l'image
      const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
      const data = imageData.data;

      // Méthode améliorée de détection de visage et d'attention basée sur l'analyse des pixels
      // Nous allons analyser les variations de couleur dans différentes zones du visage
      // et détecter les mouvements rapides qui pourraient indiquer des grimaces ou un manque de concentration

      const centerX = canvasRef.current.width / 2;
      const centerY = canvasRef.current.height / 2;
      const sampleSize = Math.min(canvasRef.current.width, canvasRef.current.height) * 0.3;

      // Définir des zones d'intérêt pour le visage (yeux, bouche)
      const eyesY = centerY - sampleSize * 0.15;
      const mouthY = centerY + sampleSize * 0.15;

      // Variables pour stocker les variations par zone
      let totalVariation = 0;
      let eyesVariation = 0;
      let mouthVariation = 0;
      let pixelCount = 0;
      let eyesPixelCount = 0;
      let mouthPixelCount = 0;

      // Stocker les variations précédentes pour détecter les mouvements brusques
      const previousVariations = useRef([]);
      if (!previousVariations.current) {
        previousVariations.current = [];
      }

      // Analyser une zone centrale de l'image
      for (let y = centerY - sampleSize/2; y < centerY + sampleSize/2; y += 2) {
        for (let x = centerX - sampleSize/2; x < centerX + sampleSize/2; x += 2) {
          if (x >= 0 && x < canvasRef.current.width && y >= 0 && y < canvasRef.current.height) {
            const i = (Math.floor(y) * canvasRef.current.width + Math.floor(x)) * 4;

            // Comparer avec le pixel voisin pour détecter les variations
            if (x + 2 < canvasRef.current.width && y + 2 < canvasRef.current.height) {
              const i2 = (Math.floor(y + 2) * canvasRef.current.width + Math.floor(x + 2)) * 4;

              // Calculer la différence entre les pixels
              const diff = Math.abs(data[i] - data[i2]) +
                          Math.abs(data[i+1] - data[i2+1]) +
                          Math.abs(data[i+2] - data[i2+2]);

              // Ajouter à la variation totale
              totalVariation += diff;
              pixelCount++;

              // Vérifier si le pixel est dans la zone des yeux
              if (Math.abs(y - eyesY) < sampleSize * 0.1) {
                eyesVariation += diff;
                eyesPixelCount++;
              }

              // Vérifier si le pixel est dans la zone de la bouche
              if (Math.abs(y - mouthY) < sampleSize * 0.1) {
                mouthVariation += diff;
                mouthPixelCount++;
              }
            }
          }
        }
      }

      // Calculer les variations moyennes
      const avgVariation = pixelCount > 0 ? totalVariation / pixelCount : 0;
      const avgEyesVariation = eyesPixelCount > 0 ? eyesVariation / eyesPixelCount : 0;
      const avgMouthVariation = mouthPixelCount > 0 ? mouthVariation / mouthPixelCount : 0;

      // Ajouter la variation actuelle à l'historique
      previousVariations.current.push(avgVariation);
      if (previousVariations.current.length > 10) {
        previousVariations.current.shift(); // Garder seulement les 10 dernières valeurs
      }

      // Calculer la variation sur les dernières frames pour détecter les mouvements brusques
      let variationChange = 0;
      if (previousVariations.current.length > 1) {
        const prevAvg = previousVariations.current.slice(0, -1).reduce((sum, val) => sum + val, 0) /
                        (previousVariations.current.length - 1);
        variationChange = Math.abs(avgVariation - prevAvg);
      }

      // Seuils de détection - valeurs réduites pour plus de sensibilité
      const detectionThreshold = 20; // Présence d'un visage (réduit pour détecter plus facilement)
      const attentionThreshold = 35; // Seuil pour considérer l'attention normale (réduit)
      const grimaceThreshold = 40;   // Seuil pour détecter des grimaces (considérablement réduit)
      const mouthGrimaceThreshold = 35; // Seuil spécifique pour les grimaces de bouche (encore plus sensible)
      const suddenMovementThreshold = 15; // Seuil pour détecter des mouvements brusques (réduit)

      // Déterminer si un visage est présent
      const isDetected = avgVariation > detectionThreshold;

      // Calculer le ratio de variation entre la bouche et les yeux pour détecter les grimaces
      const mouthEyeRatio = avgEyesVariation > 0 ? avgMouthVariation / avgEyesVariation : 1;
      const eyeMouthDiff = Math.abs(avgMouthVariation - avgEyesVariation);

      // Détection améliorée des grimaces
      const isGrimacing =
        avgMouthVariation > grimaceThreshold || // Mouvement excessif de la bouche
        avgEyesVariation > grimaceThreshold ||  // Mouvement excessif des yeux
        mouthEyeRatio > 2.5 ||                  // Bouche bouge beaucoup plus que les yeux
        eyeMouthDiff > 25 ||                    // Grande différence entre bouche et yeux
        (avgMouthVariation > mouthGrimaceThreshold && variationChange > 10); // Combinaison de mouvement de bouche et changement

      // Déterminer si l'utilisateur fait des mouvements brusques
      const isSuddenMovement = variationChange > suddenMovementThreshold;

      // Déterminer le niveau d'attention - plus strict
      const isUserAttentive = isDetected &&
                             avgVariation > detectionThreshold &&
                             avgVariation < attentionThreshold &&
                             !isGrimacing &&
                             !isSuddenMovement;

      // Logging amélioré pour le débogage
      console.log(
        "Variation moyenne:", avgVariation.toFixed(2),
        "Yeux:", avgEyesVariation.toFixed(2),
        "Bouche:", avgMouthVariation.toFixed(2),
        "Ratio bouche/yeux:", mouthEyeRatio.toFixed(2),
        "Diff yeux-bouche:", eyeMouthDiff.toFixed(2),
        "Changement:", variationChange.toFixed(2),
        "Grimace:", isGrimacing,
        "Mouvement brusque:", isSuddenMovement,
        "Attentif:", isUserAttentive
      );

      // Dessiner un cadre sur le canvas et gérer l'attention
      if (isDetected) {
        setFaceDetected(true);

        // Calculer un score d'attention basé sur la variation et les mouvements
        // Plus le score est bas, plus l'attention est bonne (moins de mouvements excessifs)
        const baseScore = Math.min(100, Math.max(60, avgVariation));
        const grimaceScore = isGrimacing ? 30 : 0;
        const movementScore = isSuddenMovement ? 20 : 0;
        const attentionScore = Math.min(100, Math.max(60, baseScore - grimaceScore - movementScore));

        setAttentionLevel(attentionScore);

        // Stocker la raison de l'inattention pour l'affichage
        let inattentionReason = '';

        if (isUserAttentive) {
          setIsAttentive(true);
          setInattentiveCount(0);

          if (videoRef.current && videoRef.current.paused && !videoRef.current.ended) {
            videoRef.current.play();
          }

          // Dessiner un cadre vert pour indiquer la détection
          ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
          ctx.lineWidth = 2;

          // Dessiner un rectangle autour de la zone analysée
          ctx.beginPath();
          ctx.rect(centerX - sampleSize/2, centerY - sampleSize/2, sampleSize, sampleSize);
          ctx.stroke();

          // Ajouter un texte
          ctx.font = '16px Arial';
          ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
          ctx.fillText('Concentration détectée', centerX - 80, centerY - sampleSize/2 - 10);

          // Dessiner des indicateurs pour les zones d'intérêt (yeux, bouche)
          ctx.beginPath();
          ctx.rect(centerX - sampleSize/3, eyesY - sampleSize * 0.1, sampleSize * 2/3, sampleSize * 0.2);
          ctx.stroke();

          ctx.beginPath();
          ctx.rect(centerX - sampleSize/3, mouthY - sampleSize * 0.1, sampleSize * 2/3, sampleSize * 0.2);
          ctx.stroke();
        } else {
          setIsAttentive(false);
          setInattentiveCount(prev => prev + 1);

          // Déterminer la raison de l'inattention
          if (isGrimacing) {
            inattentionReason = 'Grimaces détectées';
            ctx.strokeStyle = 'rgba(255, 0, 255, 0.8)'; // Violet pour les grimaces
          } else if (isSuddenMovement) {
            inattentionReason = 'Mouvements brusques';
            ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)'; // Orange pour les mouvements
          } else {
            inattentionReason = 'Manque de concentration';
            ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)'; // Orange par défaut
          }

          // Arrêter immédiatement la vidéo en cas de grimace
          if (isGrimacing) {
            // Grimace détectée - arrêt immédiat
            if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
              videoRef.current.pause();
              setShowWarning(true);

              if (inattentiveTimeoutRef.current) {
                clearTimeout(inattentiveTimeoutRef.current);
              }

              // Garder l'avertissement plus longtemps pour les grimaces
              inattentiveTimeoutRef.current = setTimeout(() => {
                setShowWarning(false);
              }, WARNING_TIMEOUT * 1.5);
            }
          }
          // Pour les autres types d'inattention, attendre plusieurs détections
          else if (inattentiveCount >= INATTENTIVE_THRESHOLD) {
            if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
              videoRef.current.pause();
              setShowWarning(true);

              if (inattentiveTimeoutRef.current) {
                clearTimeout(inattentiveTimeoutRef.current);
              }

              inattentiveTimeoutRef.current = setTimeout(() => {
                setShowWarning(false);
              }, WARNING_TIMEOUT);
            }
          }

          // Dessiner un cadre pour indiquer l'inattention
          ctx.lineWidth = 2;

          ctx.beginPath();
          ctx.rect(centerX - sampleSize/2, centerY - sampleSize/2, sampleSize, sampleSize);
          ctx.stroke();

          // Ajouter un texte
          ctx.font = '16px Arial';
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fillText(inattentionReason, centerX - 80, centerY - sampleSize/2 - 10);

          // Mettre en évidence la zone problématique avec des effets visuels plus marqués
          if (isGrimacing) {
            // Dessiner un cadre clignotant (en alternant l'opacité)
            const blinkOpacity = Math.sin(Date.now() / 200) * 0.3 + 0.7; // Effet de clignotement

            if (avgMouthVariation > avgEyesVariation) {
              // Mettre en évidence la bouche avec un effet plus visible
              ctx.lineWidth = 3;
              ctx.strokeStyle = `rgba(255, 0, 255, ${blinkOpacity})`; // Violet clignotant
              ctx.beginPath();
              ctx.rect(centerX - sampleSize/3, mouthY - sampleSize * 0.1, sampleSize * 2/3, sampleSize * 0.2);
              ctx.stroke();

              // Ajouter un texte explicite
              ctx.font = '14px Arial';
              ctx.fillStyle = `rgba(255, 0, 255, ${blinkOpacity})`;
              ctx.fillText('Grimace détectée!', centerX - 60, mouthY - sampleSize * 0.15);
            } else {
              // Mettre en évidence les yeux avec un effet plus visible
              ctx.lineWidth = 3;
              ctx.strokeStyle = `rgba(255, 0, 255, ${blinkOpacity})`; // Violet clignotant
              ctx.beginPath();
              ctx.rect(centerX - sampleSize/3, eyesY - sampleSize * 0.1, sampleSize * 2/3, sampleSize * 0.2);
              ctx.stroke();

              // Ajouter un texte explicite
              ctx.font = '14px Arial';
              ctx.fillStyle = `rgba(255, 0, 255, ${blinkOpacity})`;
              ctx.fillText('Grimace détectée!', centerX - 60, eyesY - sampleSize * 0.15);
            }

            // Dessiner un contour autour de tout le visage pour attirer l'attention
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]); // Ligne pointillée
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, sampleSize * 0.4, sampleSize * 0.5, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]); // Réinitialiser le style de ligne
          } else if (isSuddenMovement) {
            // Mettre en évidence les mouvements brusques
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)';
            ctx.beginPath();
            ctx.rect(centerX - sampleSize/3, centerY - sampleSize * 0.3, sampleSize * 2/3, sampleSize * 0.6);
            ctx.stroke();
          }
        }

        // Stocker la raison de l'inattention dans l'état pour l'utiliser dans l'alerte
        if (!isUserAttentive) {
          setInattentionReason(inattentionReason);
        } else {
          setInattentionReason('');
        }

      } else {
        setFaceDetected(false);
        setIsAttentive(false);

        // Si aucun visage n'est détecté, pauser la vidéo
        if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
          videoRef.current.pause();
          setShowWarning(true);

          if (inattentiveTimeoutRef.current) {
            clearTimeout(inattentiveTimeoutRef.current);
          }

          inattentiveTimeoutRef.current = setTimeout(() => {
            setShowWarning(false);
          }, WARNING_TIMEOUT);
        }

        // Dessiner un cadre rouge pour indiquer l'absence de détection
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.rect(centerX - sampleSize/2, centerY - sampleSize/2, sampleSize, sampleSize);
        ctx.stroke();

        // Dessiner une croix
        ctx.beginPath();
        ctx.moveTo(centerX - sampleSize/3, centerY - sampleSize/3);
        ctx.lineTo(centerX + sampleSize/3, centerY + sampleSize/3);
        ctx.moveTo(centerX + sampleSize/3, centerY - sampleSize/3);
        ctx.lineTo(centerX - sampleSize/3, centerY + sampleSize/3);
        ctx.stroke();

        // Ajouter un texte
        ctx.font = '16px Arial';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fillText('Aucun visage détecté', centerX - 80, centerY - sampleSize/2 - 10);

        // Stocker la raison de l'inattention
        setInattentionReason('Aucun visage détecté');
      }
    } catch (err) {
      console.error("❌ Erreur lors de la détection faciale:", err);
    }

    // Continuer la détection
    if (!isProcessing) {
      requestAnimationFrame(detectFace);
    }
  };

  // Fonction de gestion de lecture supprimée car non utilisée

  // Référence au lecteur vidéo
  const setVideoReference = (element) => {
    videoRef.current = element;

    if (element && onVideoReady) {
      onVideoReady(element);
    }
  };

  // Intercepter les événements de lecture de la vidéo
  useEffect(() => {
    if (videoRef.current) {
      // Ajouter un écouteur d'événement pour empêcher la lecture si la caméra n'est pas active
      const handlePlay = (e) => {
        if (!cameraActive) {
          e.preventDefault();
          videoRef.current.pause();
          setShowCameraDialog(true);
        }
      };

      videoRef.current.addEventListener('play', handlePlay);

      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('play', handlePlay);
        }
      };
    }
  }, [cameraActive, videoRef.current]);

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* Lecteur vidéo principal */}
      <Box sx={{ position: 'relative', width: '100%' }}>
        {React.cloneElement(children, { ref: setVideoReference })}

        {/* Overlay de blocage si la caméra n'est pas active */}
        {!cameraActive && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}
            onClick={() => setShowCameraDialog(true)}
          >
            <LockIcon sx={{ fontSize: 60, color: 'white', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'white', textAlign: 'center', mb: 1 }}>
              Vidéo verrouillée
            </Typography>
            <Typography variant="body1" sx={{ color: 'white', textAlign: 'center', mb: 2 }}>
              Vous devez activer votre caméra pour regarder cette vidéo
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<VideocamIcon />}
              onClick={() => setShowCameraDialog(true)}
            >
              Activer la caméra
            </Button>
          </Box>
        )}

        {/* Indicateur d'attention */}
        {cameraActive && (
          <Box className={`attention-indicator ${isAttentive ? 'attentive' : 'inattentive'}`}>
            <span className={`attention-dot ${isAttentive ? 'attentive' : 'inattentive'}`}></span>
            <Typography variant="caption" sx={{ color: 'white' }}>
              {isAttentive ? 'Attentif' : 'Inattentif'}
            </Typography>
          </Box>
        )}

        {/* Barre d'attention */}
        {cameraActive && (
          <Box className="attention-bar">
            <Box
              className={`attention-level ${isAttentive ? 'attentive' : 'inattentive'}`}
              sx={{ width: `${attentionLevel}%` }}
            />
          </Box>
        )}

        {/* Avertissement d'inattention amélioré */}
        {showWarning && (
          <Box
            className="attention-warning"
            sx={{
              backgroundColor: inattentionReason.includes('Grimace') ? 'rgba(255, 0, 255, 0.9)' : 'rgba(255, 0, 0, 0.8)',
              padding: '15px',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              animation: inattentionReason.includes('Grimace') ? 'grimace-alert 1.2s infinite' : 'pulse 1.5s infinite',
              border: '2px solid white',
              maxWidth: '90%',
              margin: '0 auto'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <WarningIcon sx={{ mr: 1, fontSize: 28, color: 'white' }} />
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                Attention requise!
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ color: 'white', fontWeight: 'medium' }}>
              {faceDetected ? (
                inattentionReason ? (
                  inattentionReason.includes('Grimace') ? (
                    <>
                      <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                        {inattentionReason}
                      </span>
                      <br />
                      Veuillez garder une expression neutre pour continuer la vidéo.
                    </>
                  ) : (
                    `${inattentionReason}. Veuillez vous concentrer pour continuer la vidéo.`
                  )
                ) : (
                  "Veuillez rester attentif pour continuer la vidéo"
                )
              ) : (
                "Veuillez rester devant la caméra pour continuer la vidéo"
              )}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Caméra (cachée visuellement mais active) */}
      <Box sx={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '180px',
        height: '135px',
        zIndex: 1000,
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        display: cameraActive ? 'block' : 'none'
      }} className={`camera-container ${isAttentive ? 'attentive' : 'inattentive'}`}>
        <video
          ref={cameraRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)'
          }}
        />
      </Box>

      {/* Dialogue d'activation de la caméra */}
      <Dialog
        open={showCameraDialog}
        onClose={() => setShowCameraDialog(false)}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <LockIcon sx={{ mr: 1, color: 'error.main' }} />
          Activation de la caméra obligatoire
        </DialogTitle>
        <DialogContent>
          {isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>{loadingMessage}</Typography>
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          ) : cameraPermissionDenied ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              L'accès à la caméra a été refusé. Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur pour continuer.
            </Alert>
          ) : (
            <>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Cette vidéo ne peut pas être visionnée sans activer votre caméra
                </Typography>
                <Typography variant="body2">
                  Pour des raisons pédagogiques, nous devons vérifier votre présence et votre attention pendant le cours.
                </Typography>
              </Alert>

              <Typography variant="body1" sx={{ mb: 2 }}>
                Pour suivre ce cours, vous devez activer votre caméra. Cela nous permet de :
              </Typography>

              <ul>
                <li>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Vérifier votre présence pendant toute la durée du cours
                  </Typography>
                </li>
                <li>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Mesurer votre niveau d'attention et vous aider à rester concentré
                  </Typography>
                </li>
                <li>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Pauser automatiquement la vidéo si vous vous absentez ou perdez votre concentration
                  </Typography>
                </li>
              </ul>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 2 }}>
                Votre caméra sera utilisée uniquement pour la détection de présence et d'attention. Aucune donnée vidéo n'est enregistrée ou partagée.
              </Typography>

              <Box sx={{
                p: 2,
                bgcolor: 'error.light',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                mb: 2
              }}>
                <LockIcon sx={{ mr: 1, color: 'error.dark' }} />
                <Typography variant="body2" sx={{ color: 'error.dark', fontWeight: 'bold' }}>
                  La vidéo restera verrouillée tant que la caméra n'est pas activée.
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowCameraDialog(false)}
            color="error"
            startIcon={<VideocamOffIcon />}
            disabled={isLoading}
          >
            Refuser et quitter
          </Button>
          <Button
            onClick={startCamera}
            color="primary"
            variant="contained"
            startIcon={<VideocamIcon />}
            disabled={isLoading || cameraActive}
            sx={{ fontWeight: 'bold' }}
          >
            Activer la caméra et regarder la vidéo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CameraRequiredVideoPlayer;
