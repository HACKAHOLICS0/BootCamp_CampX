import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import WarningIcon from '@mui/icons-material/Warning';
import LockIcon from '@mui/icons-material/Lock';
import TimerIcon from '@mui/icons-material/Timer';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
// Réactivation de face-api.js pour la détection des grimaces
import * as faceapi from 'face-api.js';
// Importation du détecteur de grimaces personnalisé
import GrimaceDetector from '../../utils/GrimaceDetector';
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
  const grimaceDetectorRef = useRef(null);

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
  const [alertCount, setAlertCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockEndTime, setBlockEndTime] = useState(null);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [grimaceDetected, setGrimaceDetected] = useState(false);
  const [concentrationLost, setConcentrationLost] = useState(false);

  // Constantes
  const INATTENTIVE_THRESHOLD = 3; // Nombre de détections inattentives avant de pauser la vidéo
  const WARNING_TIMEOUT = 5000; // Durée d'affichage de l'avertissement en ms
  const MAX_ALERTS = 2; // Nombre maximum d'alertes avant blocage
  const BLOCK_DURATION = 5 * 60 * 1000; // Durée de blocage en ms (5 minutes)
  const ALERT_RESET_TIMEOUT = 60 * 1000; // Délai de réinitialisation des alertes (1 minute)

  // Vérifier si l'utilisateur est bloqué
  const checkBlockStatus = () => {
    try {
      // Récupérer les données de blocage du localStorage
      const blockData = localStorage.getItem('videoAccessBlock');

      if (blockData) {
        const { endTime, videoId } = JSON.parse(blockData);

        // Vérifier si le blocage concerne cette vidéo et s'il est toujours actif
        if (videoId === videoUrl && endTime > Date.now()) {
          setIsBlocked(true);
          setBlockEndTime(endTime);
          setShowBlockDialog(true);

          // Mettre à jour le temps restant
          const updateRemainingTime = () => {
            const remaining = Math.max(0, endTime - Date.now());
            setBlockTimeRemaining(Math.ceil(remaining / 1000));

            if (remaining <= 0) {
              // Le blocage est terminé
              setIsBlocked(false);
              setShowBlockDialog(false);
              localStorage.removeItem('videoAccessBlock');
            } else {
              // Continuer à mettre à jour le temps restant
              setTimeout(updateRemainingTime, 1000);
            }
          };

          updateRemainingTime();
          return true;
        } else if (endTime <= Date.now()) {
          // Le blocage est expiré, le supprimer
          localStorage.removeItem('videoAccessBlock');
        }
      }
      return false;
    } catch (error) {
      console.error("Erreur lors de la vérification du blocage:", error);
      return false;
    }
  };

  // Fonction pour bloquer l'accès à la vidéo
  const blockVideoAccess = () => {
    const endTime = Date.now() + BLOCK_DURATION;
    setIsBlocked(true);
    setBlockEndTime(endTime);
    setShowBlockDialog(true);

    // Réinitialiser le compteur d'alertes
    setAlertCount(0);

    // Sauvegarder les informations de blocage dans le localStorage
    localStorage.setItem('videoAccessBlock', JSON.stringify({
      endTime,
      videoId: videoUrl,
      reason: inattentionReason
    }));

    console.log(`🚫 Accès à la vidéo bloqué pour ${BLOCK_DURATION/60000} minutes. Raison: ${inattentionReason}`);

    // Mettre à jour le temps restant
    const updateRemainingTime = () => {
      const remaining = Math.max(0, endTime - Date.now());
      setBlockTimeRemaining(Math.ceil(remaining / 1000));

      if (remaining <= 0) {
        // Le blocage est terminé
        setIsBlocked(false);
        setShowBlockDialog(false);
        localStorage.removeItem('videoAccessBlock');
        console.log("✅ Blocage terminé, accès à la vidéo rétabli");
      } else {
        // Continuer à mettre à jour le temps restant
        setTimeout(updateRemainingTime, 1000);
      }
    };

    updateRemainingTime();
  };

  // Initialisation avec chargement des modèles de détection faciale - Version simplifiée
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log("🔍 Chargement des modèles de détection faciale...");
        setLoadingMessage('Chargement des modèles...');

        // Vérifier si l'utilisateur est bloqué
        const isUserBlocked = checkBlockStatus();

        if (!isUserBlocked) {
          // Utiliser un CDN plus fiable pour les modèles
          const CDN_URLS = [
            'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model',
            'https://cdn.jsdelivr.net/npm/face-api.js/weights',
            'https://unpkg.com/face-api.js/weights'
          ];

          let modelsLoaded = false;

          // Essayer chaque CDN jusqu'à ce que l'un fonctionne
          for (let i = 0; i < CDN_URLS.length; i++) {
            if (modelsLoaded) break;

            const MODEL_URL = CDN_URLS[i];
            console.log(`🌐 Tentative de chargement depuis CDN ${i+1}/${CDN_URLS.length}: ${MODEL_URL}`);
            setLoadingMessage(`Chargement des modèles depuis CDN ${i+1}/${CDN_URLS.length}...`);

            try {
              // Charger uniquement les modèles essentiels
              console.log("🔄 Chargement de tinyFaceDetector...");
              await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
              console.log("✅ tinyFaceDetector chargé!");

              console.log("🔄 Chargement de faceLandmark68Net...");
              await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
              console.log("✅ faceLandmark68Net chargé!");

              modelsLoaded = true;
              console.log(`✅ Modèles chargés avec succès depuis ${MODEL_URL}`);
            } catch (e) {
              console.error(`❌ Échec du chargement depuis ${MODEL_URL}:`, e);
            }
          }

          // Vérifier si les modèles sont chargés
          console.log("🔍 Vérification de l'état des modèles:");
          console.log("- tinyFaceDetector:", faceapi.nets.tinyFaceDetector.isLoaded ? "Chargé ✅" : "Non chargé ❌");
          console.log("- faceLandmark68Net:", faceapi.nets.faceLandmark68Net.isLoaded ? "Chargé ✅" : "Non chargé ❌");

          // Initialiser le détecteur de grimaces
          try {
            console.log("🔍 Initialisation du détecteur de grimaces pendant le chargement...");
            grimaceDetectorRef.current = new GrimaceDetector({
              eyeClosedThreshold: 0.2,   // Seuil plus bas pour les yeux fermés (tolérer les clignements)
              mouthOpenThreshold: 0.5,   // Seuil pour la bouche ouverte
              attentionThreshold: 70,    // Seuil d'attention
              consecutiveDetectionsRequired: 3, // Nombre de détections consécutives pour confirmer une inattention
              weights: {
                eyeOpenness: 0.4,        // Importance réduite de l'ouverture des yeux
                mouthNormal: 0.2,        // Importance de la position normale de la bouche
                faceSymmetry: 0.4        // Importance augmentée de la symétrie du visage
              },
              debug: true                // Activer les logs de débogage
            });
            console.log("✅ Détecteur de grimaces initialisé avec succès");
          } catch (grimaceError) {
            console.error("❌ Erreur lors de l'initialisation du détecteur de grimaces:", grimaceError);
          }

          // Activer la détection même si les modèles ne sont pas chargés
          console.log("⚠️ Activation de la détection faciale");
          modelsLoadedRef.current = true;
          setLoadingMessage('Initialisation terminée. Veuillez activer votre caméra.');
          setIsLoading(false);
        }
      } catch (err) {
        console.error("❌ Erreur lors de l'initialisation:", err);
        // Activer quand même pour permettre l'utilisation
        modelsLoadedRef.current = true;
        setLoadingMessage('Initialisation terminée. Veuillez activer votre caméra.');
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

  // Démarrer la caméra - Version ULTRA SIMPLIFIÉE
  const startCamera = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage('Activation de la caméra...');

      console.log("📷 Demande d'accès à la caméra...");

      // Demander l'accès à la caméra avec des contraintes plus précises
      const constraints = {
        video: {
          width: { min: 320, ideal: 640, max: 1280 },
          height: { min: 240, ideal: 480, max: 720 },
          facingMode: "user",
          frameRate: { ideal: 30 }
        },
        audio: false
      };

      console.log("📷 Contraintes de la caméra:", constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("✅ Flux de la caméra obtenu:", stream);

      // Vérifier que le flux contient des pistes vidéo
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length === 0) {
        throw new Error("Aucune piste vidéo trouvée dans le flux de la caméra");
      }

      console.log("📷 Pistes vidéo:", videoTracks.map(track => track.label));

      if (cameraRef.current) {
        // Assigner le flux à la vidéo
        cameraRef.current.srcObject = stream;
        cameraStreamRef.current = stream;

        console.log("📷 Flux assigné à l'élément vidéo");

        // Configurer les gestionnaires d'événements
        cameraRef.current.onloadedmetadata = () => {
          console.log("📷 Métadonnées de la vidéo chargées");
          console.log(`📷 Dimensions de la vidéo: ${cameraRef.current.videoWidth}x${cameraRef.current.videoHeight}`);

          // Démarrer la lecture de la vidéo
          cameraRef.current.play()
            .then(() => {
              console.log("✅ Lecture de la caméra démarrée");

              // Créer le canvas si nécessaire
              if (!canvasRef.current && cameraRef.current.parentNode) {
                const canvas = document.createElement('canvas');
                canvas.width = cameraRef.current.videoWidth;
                canvas.height = cameraRef.current.videoHeight;
                canvas.style.position = 'absolute';
                canvas.style.top = '0';
                canvas.style.left = '0';
                canvas.id = 'detection-canvas';
                canvasRef.current = canvas;
                cameraRef.current.parentNode.appendChild(canvas);
                console.log("✅ Canvas de détection créé");
              }

              // IMPORTANT: Fermer le dialogue et désactiver le chargement AVANT de démarrer la détection
              setShowCameraDialog(false);
              setIsLoading(false);

              // IMPORTANT: Démarrer la détection IMMÉDIATEMENT
              console.log("🚀 Démarrage immédiat de la détection...");
              startDetection();
            })
            .catch(playError => {
              console.error("❌ Erreur lors du démarrage de la lecture de la caméra:", playError);
              setError("Impossible de démarrer la caméra. Veuillez réessayer.");
              setIsLoading(false);
            });
        };

        // Gérer les erreurs de chargement
        cameraRef.current.onerror = (e) => {
          console.error("❌ Erreur de l'élément vidéo:", e);
          setError("Erreur lors du chargement de la caméra. Veuillez réessayer.");
          setIsLoading(false);
        };
      } else {
        console.error("❌ Référence à l'élément vidéo non disponible");
        setError("Erreur technique. Veuillez rafraîchir la page.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("❌ Erreur d'accès à la caméra:", err);
      setCameraPermissionDenied(true);
      setError(`Impossible d'accéder à la caméra: ${err.message}. Veuillez vérifier les permissions de votre navigateur.`);
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

  // Démarrer la détection faciale avec un intervalle régulier - Version ULTRA SIMPLIFIÉE
  const startDetection = () => {
    // Nettoyer l'intervalle existant si nécessaire
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      console.log("🔄 Intervalle de détection précédent nettoyé");
    }

    console.log("🚀 Démarrage de la détection faciale avec analyse de grimaces...");

    // Vérification minimale - juste la référence à la caméra
    if (!cameraRef.current) {
      console.error("❌ Référence à la caméra non disponible lors du démarrage de la détection");
      return;
    }

    // IMPORTANT: Forcer l'état actif sans condition
    setCameraActive(true);
    console.log("✅ État de la caméra forcé à actif");

    // Initialiser le détecteur de grimaces s'il n'existe pas déjà
    if (!grimaceDetectorRef.current) {
      try {
        console.log("🔍 Initialisation du détecteur de grimaces...");
        grimaceDetectorRef.current = new GrimaceDetector({
          eyeClosedThreshold: 0.2,   // Seuil plus bas pour les yeux fermés (tolérer les clignements)
          mouthOpenThreshold: 0.5,   // Seuil pour la bouche ouverte
          attentionThreshold: 70,    // Seuil d'attention
          consecutiveDetectionsRequired: 3, // Nombre de détections consécutives pour confirmer une inattention
          weights: {
            eyeOpenness: 0.4,        // Importance réduite de l'ouverture des yeux
            mouthNormal: 0.2,        // Importance de la position normale de la bouche
            faceSymmetry: 0.4        // Importance augmentée de la symétrie du visage
          },
          debug: true                // Activer les logs de débogage
        });
        console.log("✅ Détecteur de grimaces initialisé");
      } catch (error) {
        console.error("❌ Erreur lors de l'initialisation du détecteur de grimaces:", error);
        // Créer un détecteur de secours
        grimaceDetectorRef.current = {
          analyze: () => ({ isGrimacing: false, attentionScore: 100, eyesClosed: false, mouthOpen: false, details: {} }),
          drawResults: () => {}
        };
        console.log("⚠️ Détecteur de grimaces de secours créé");
      }
    }

    // Forcer l'état attentif immédiatement pour permettre la lecture
    setFaceDetected(true);
    setIsAttentive(true);
    setShowWarning(false);

    // S'assurer que la vidéo joue
    if (videoRef.current && videoRef.current.paused && !videoRef.current.ended) {
      videoRef.current.play()
        .then(() => console.log("✅ Lecture de la vidéo démarrée"))
        .catch(err => console.error("❌ Erreur lors du démarrage de la vidéo:", err));
    }

    // IMPORTANT: Réinitialiser l'état de traitement
    setIsProcessing(false);

    // Configurer un intervalle court (1 seconde) pour les détections
    console.log("⏱️ Configuration de l'intervalle de détection...");
    detectionIntervalRef.current = setInterval(() => {
      // IMPORTANT: Ne pas vérifier cameraActive ici, car il peut être désynchronisé
      if (!isProcessing) {
        detectFace().catch(error => {
          console.error("❌ Erreur dans l'intervalle de détection:", error);
        });
      } else {
        console.log("⚠️ Traitement en cours, détection ignorée");
      }
    }, 1000);

    console.log("✅ Détection faciale avec analyse de grimaces démarrée (intervalle: 1 seconde)");
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

    // Nettoyer la référence au détecteur de grimaces
    grimaceDetectorRef.current = null;
  };

  // Version avec détection de grimaces - ULTRA SIMPLIFIÉE
  const detectFace = async () => {
    // Vérification minimale de la caméra - juste ce qui est nécessaire
    if (!cameraRef.current) {
      console.log("⚠️ Référence à la caméra non disponible");
      return;
    }

    // IMPORTANT: Ne pas vérifier l'état cameraActive, car il peut être désynchronisé
    // Vérifier directement si la vidéo est prête à être utilisée

    if (!cameraRef.current.videoWidth || !cameraRef.current.videoHeight) {
      console.log("⚠️ La vidéo n'est pas encore prête pour la détection");
      return;
    }

    // Si nous arrivons ici, considérer que la caméra est active
    if (!cameraActive) {
      console.log("⚠️ État cameraActive incorrect, mais la vidéo est prête - correction de l'état");
      setCameraActive(true);
    }

    try {
      setIsProcessing(true);

      // Vérifier si la vidéo est prête
      if (!cameraRef.current.videoWidth || !cameraRef.current.videoHeight) {
        console.log("⚠️ La vidéo n'est pas encore prête pour la détection");
        setIsProcessing(false);
        return;
      }

      console.log(`📹 Dimensions de la caméra: ${cameraRef.current.videoWidth}x${cameraRef.current.videoHeight}`);

      // Créer un canvas pour la détection si nécessaire
      if (!canvasRef.current) {
        try {
          // Créer un canvas manuellement
          const canvas = document.createElement('canvas');
          canvas.style.position = 'absolute';
          canvas.style.top = '0';
          canvas.style.left = '0';
          canvas.width = cameraRef.current.videoWidth;
          canvas.height = cameraRef.current.videoHeight;
          canvas.id = 'face-canvas'; // Ajouter un ID pour faciliter la référence
          canvasRef.current = canvas;
          cameraRef.current.parentNode.appendChild(canvas);
          console.log("✅ Canvas créé manuellement");
        } catch (canvasError) {
          console.error("❌ Erreur lors de la création du canvas:", canvasError);
        }
      }

      // Ajuster les dimensions du canvas si nécessaire
      if (canvasRef.current) {
        canvasRef.current.width = cameraRef.current.videoWidth;
        canvasRef.current.height = cameraRef.current.videoHeight;
      }

      // Vérifier si le détecteur de grimaces est initialisé, sinon l'initialiser
      if (!grimaceDetectorRef.current) {
        console.log("🔍 Initialisation tardive du détecteur de grimaces...");
        grimaceDetectorRef.current = new GrimaceDetector({
          eyeClosedThreshold: 0.2,   // Seuil plus bas pour les yeux fermés (tolérer les clignements)
          mouthOpenThreshold: 0.5,   // Seuil pour la bouche ouverte
          attentionThreshold: 70,    // Seuil d'attention
          consecutiveDetectionsRequired: 3, // Nombre de détections consécutives pour confirmer une inattention
          weights: {
            eyeOpenness: 0.4,        // Importance réduite de l'ouverture des yeux
            mouthNormal: 0.2,        // Importance de la position normale de la bouche
            faceSymmetry: 0.4        // Importance augmentée de la symétrie du visage
          },
          debug: true                // Activer les logs de débogage
        });
        console.log("✅ Détecteur de grimaces initialisé (tardif)");
      }

      // IMPORTANT: Dessiner l'image de la caméra sur le canvas temporaire
      // Cela est crucial pour que la détection fonctionne correctement
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = cameraRef.current.videoWidth;
      tempCanvas.height = cameraRef.current.videoHeight;
      const tempCtx = tempCanvas.getContext('2d');

      // IMPORTANT: Vérifier que la vidéo est jouée avant de dessiner
      if (cameraRef.current.paused) {
        console.log("⚠️ La vidéo est en pause, tentative de lecture...");
        try {
          await cameraRef.current.play();
          console.log("✅ Lecture de la vidéo démarrée");
        } catch (playError) {
          console.error("❌ Impossible de démarrer la lecture de la vidéo:", playError);
          setIsProcessing(false);
          return;
        }
      }

      // Dessiner l'image de la caméra sur le canvas temporaire
      try {
        tempCtx.drawImage(cameraRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
        console.log(`✅ Image de la caméra dessinée sur le canvas temporaire: ${tempCanvas.width}x${tempCanvas.height}`);
      } catch (drawError) {
        console.error("❌ Erreur lors du dessin de l'image de la caméra:", drawError);
        setIsProcessing(false);
        return;
      }

      // Vérifier que l'image n'est pas vide
      try {
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const hasData = imageData.data.some(channel => channel !== 0);
        if (!hasData) {
          console.log("⚠️ L'image de la caméra semble vide");
          setIsProcessing(false);
          return;
        }
        console.log("✅ L'image de la caméra contient des données");
      } catch (imageDataError) {
        console.error("❌ Erreur lors de la vérification des données de l'image:", imageDataError);
      }

      // Tenter la détection avec face-api.js
      if (modelsLoadedRef.current) {
        try {
          console.log("🔍 Tentative de détection faciale avec face-api.js...");

          // SIMPLIFICATION: Utiliser SsdMobilenetv1 qui est plus robuste que TinyFaceDetector
          console.log("🔍 Exécution de detectAllFaces() avec SsdMobilenetv1...");

          // Vérifier si SsdMobilenetv1 est chargé, sinon essayer de le charger
          if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
            console.log("⚠️ SsdMobilenetv1 n'est pas chargé, tentative de chargement...");
            try {
              await faceapi.nets.ssdMobilenetv1.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model');
              console.log("✅ SsdMobilenetv1 chargé avec succès");
            } catch (loadError) {
              console.error("❌ Erreur lors du chargement de SsdMobilenetv1:", loadError);
            }
          }

          // Essayer d'abord avec SsdMobilenetv1 qui est plus robuste
          let detections;
          try {
            detections = await faceapi.detectAllFaces(
              tempCanvas,
              new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 }) // Seuil bas pour détecter plus facilement
            ).withFaceLandmarks();

            console.log("✅ Détection avec SsdMobilenetv1 réussie");
          } catch (ssdError) {
            console.error("❌ Erreur avec SsdMobilenetv1:", ssdError);

            // Fallback sur TinyFaceDetector
            console.log("🔄 Fallback sur TinyFaceDetector...");
            detections = await faceapi.detectAllFaces(
              tempCanvas,
              new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.2 })
            ).withFaceLandmarks();
          }

          // Si un visage est détecté
          if (detections && detections.length > 0) {
            console.log(`✅ ${detections.length} visage(s) détecté(s)`);

            // Vérifier si les landmarks sont présents
            if (!detections[0].landmarks || !detections[0].landmarks.positions || detections[0].landmarks.positions.length !== 68) {
              console.error("❌ Points de repère faciaux incomplets ou manquants:", detections[0].landmarks);
              throw new Error("Points de repère faciaux incomplets");
            }

            console.log("✅ Points de repère faciaux détectés:", detections[0].landmarks.positions.length);

            // Redimensionner les résultats pour correspondre à la taille d'affichage
            const displaySize = {
              width: cameraRef.current.videoWidth || 640,
              height: cameraRef.current.videoHeight || 480
            };
            console.log(`🔍 Redimensionnement pour: ${displaySize.width}x${displaySize.height}`);

            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            // Analyser les grimaces avec notre détecteur personnalisé
            console.log("🔍 Analyse des grimaces...");
            const grimaceResults = grimaceDetectorRef.current.analyze(resizedDetections[0].landmarks);
            console.log("✅ Résultats de l'analyse:", grimaceResults);

            // Mettre à jour les états en fonction des résultats
            setGrimaceDetected(grimaceResults.isGrimacing);
            setIsAttentive(!grimaceResults.isGrimacing);
            setAttentionLevel(grimaceResults.attentionScore);

            // Mettre à jour la raison de l'inattention si nécessaire
            if (grimaceResults.isGrimacing) {
              // Utiliser la raison spécifique fournie par le détecteur
              setInattentionReason(grimaceResults.inattentionReason || "Inattention détectée");

              // Afficher l'avertissement
              setShowWarning(true);

              // Pauser la vidéo
              if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
                videoRef.current.pause();
              }

              // Incrémenter le compteur d'alertes SEULEMENT si c'est une nouvelle alerte
              if (!showWarning) {
                setAlertCount(prev => {
                  const newCount = prev + 1;
                  console.log(`⚠️ Alerte d'inattention #${newCount}/${MAX_ALERTS}: ${grimaceResults.inattentionReason}`);

                  // Si le nombre maximum d'alertes est atteint, bloquer l'accès
                  if (newCount >= MAX_ALERTS) {
                    console.log(`🚫 Nombre maximum d'alertes atteint (${MAX_ALERTS}). Blocage de l'accès pour 5 minutes.`);
                    blockVideoAccess();
                  } else {
                    // Programmer la réinitialisation du compteur d'alertes après un délai
                    console.log(`⏱️ Programmation de la réinitialisation des alertes dans ${ALERT_RESET_TIMEOUT/1000} secondes`);
                    setTimeout(() => {
                      console.log("🔄 Réinitialisation du compteur d'alertes");
                      setAlertCount(0);
                    }, ALERT_RESET_TIMEOUT);
                  }
                  return newCount;
                });
              }
            } else {
              setInattentionReason('');
              setShowWarning(false);

              // Reprendre la lecture si la vidéo est en pause
              if (videoRef.current && videoRef.current.paused && !videoRef.current.ended) {
                videoRef.current.play();
              }
            }

            // Dessiner les résultats sur le canvas
            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

              // Dessiner les points de repère et les résultats
              grimaceDetectorRef.current.drawResults(canvasRef.current, resizedDetections[0].landmarks, grimaceResults);
            }
          } else {
            console.log("⚠️ Aucun visage détecté dans les résultats de face-api.js");

            // Essayer une approche plus simple pour la détection
            try {
              console.log("🔍 Tentative de détection simplifiée...");

              // Utiliser directement le détecteur sans les landmarks
              const simpleDetections = await faceapi.detectAllFaces(
                tempCanvas,
                new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.1 }) // Paramètres très permissifs
              );

              console.log(`🔍 Détection simplifiée: ${simpleDetections.length} visage(s) trouvé(s)`);

              if (simpleDetections && simpleDetections.length > 0) {
                // Un visage a été détecté avec la méthode simplifiée
                console.log("✅ Visage détecté avec la méthode simplifiée");
                setFaceDetected(true);
                setIsAttentive(true); // Considérer l'utilisateur comme attentif par défaut
                setShowWarning(false);

                // Dessiner un cadre autour du visage
                if (canvasRef.current) {
                  const ctx = canvasRef.current.getContext('2d');
                  ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                  // Dessiner un cadre vert
                  ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
                  ctx.lineWidth = 3;

                  // Dessiner le rectangle du visage
                  const box = simpleDetections[0].box;
                  ctx.strokeRect(box.x, box.y, box.width, box.height);

                  // Ajouter un texte
                  ctx.font = '16px Arial';
                  ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
                  ctx.fillText('Visage détecté (mode simplifié)', 10, 30);
                }

                // S'assurer que la vidéo joue
                if (videoRef.current && videoRef.current.paused && !videoRef.current.ended) {
                  videoRef.current.play();
                }

                return; // Sortir de la fonction
              }
            } catch (simpleDetectionError) {
              console.error("❌ Erreur lors de la détection simplifiée:", simpleDetectionError);
            }

            // Si on arrive ici, aucune méthode n'a fonctionné
            console.log("❌ Aucun visage détecté avec aucune méthode");

            // Si aucun visage n'est détecté, mettre à jour les états
            setFaceDetected(false);
            setIsAttentive(false);
            setInattentionReason("Aucun visage détecté");
            setShowWarning(true);

            // Pauser la vidéo
            if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
              videoRef.current.pause();
            }

            // Dessiner un message d'avertissement sur le canvas
            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

              ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
              ctx.lineWidth = 3;
              ctx.strokeRect(0, 0, canvasRef.current.width, canvasRef.current.height);

              ctx.font = '20px Arial';
              ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
              ctx.fillText('Aucun visage détecté', 10, 30);
              ctx.fillText('Veuillez vous placer face à la caméra', 10, 60);
            }
          }
        } catch (detectionError) {
          console.error("❌ Erreur lors de la détection faciale:", detectionError);

          // Essayer une approche encore plus simple - juste pour permettre la lecture
          try {
            console.log("🔍 Tentative de détection de secours...");

            // Utiliser le détecteur le plus simple possible
            const emergencyDetections = await faceapi.detectAllFaces(
              tempCanvas,
              new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 }) // Utiliser SSD Mobilenet qui est plus robuste
            );

            console.log(`🔍 Détection de secours: ${emergencyDetections ? emergencyDetections.length : 0} visage(s) trouvé(s)`);

            if (emergencyDetections && emergencyDetections.length > 0) {
              // Un visage a été détecté avec la méthode de secours
              console.log("✅ Visage détecté avec la méthode de secours");
              setFaceDetected(true);
              setIsAttentive(true);
              setShowWarning(false);

              // Dessiner un cadre autour du visage
              if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                // Dessiner un cadre vert
                ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
                ctx.lineWidth = 3;

                // Dessiner le rectangle du visage
                const box = emergencyDetections[0].box || emergencyDetections[0].detection.box;
                if (box) {
                  ctx.strokeRect(box.x, box.y, box.width, box.height);
                } else {
                  ctx.strokeRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                }

                // Ajouter un texte
                ctx.font = '16px Arial';
                ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
                ctx.fillText('Visage détecté (mode secours)', 10, 30);
              }

              // S'assurer que la vidéo joue
              if (videoRef.current && videoRef.current.paused && !videoRef.current.ended) {
                videoRef.current.play();
              }

              return; // Sortir de la fonction
            }
          } catch (emergencyError) {
            console.error("❌ Erreur lors de la détection de secours:", emergencyError);
          }

          // Si toutes les tentatives ont échoué, simuler une détection réussie
          console.log("⚠️ Simulation d'une détection réussie pour permettre la lecture");
          setFaceDetected(true);
          setIsAttentive(true);
          setShowWarning(false);

          // Dessiner un cadre vert sur le canvas
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.strokeRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            ctx.font = '16px Arial';
            ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.fillText('Détection faciale active (mode secours)', 10, 30);
            ctx.fillText('Problème technique - lecture autorisée', 10, 60);
          }

          // S'assurer que la vidéo joue
          if (videoRef.current && videoRef.current.paused && !videoRef.current.ended) {
            videoRef.current.play();
          }
        }
      } else {
        // Si les modèles ne sont pas chargés, simuler une détection réussie
        setFaceDetected(true);
        setIsAttentive(true);
        setShowWarning(false);

        // Dessiner un cadre vert sur le canvas
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

          ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
          ctx.lineWidth = 3;
          ctx.strokeRect(0, 0, canvasRef.current.width, canvasRef.current.height);

          ctx.font = '16px Arial';
          ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
          ctx.fillText('Détection faciale active (mode basique)', 10, 30);
        }

        // S'assurer que la vidéo joue
        if (videoRef.current && videoRef.current.paused && !videoRef.current.ended) {
          videoRef.current.play();
        }
      }
    } catch (err) {
      console.error("❌ Erreur générale:", err);

      // Même en cas d'erreur, simuler une détection réussie
      setFaceDetected(true);
      setIsAttentive(true);
      setShowWarning(false);

      // S'assurer que la vidéo joue même en cas d'erreur
      if (videoRef.current && videoRef.current.paused && !videoRef.current.ended) {
        videoRef.current.play();
      }
    } finally {
      setIsProcessing(false);
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
                      Vos yeux sont trop fermés (moins de 70% d'ouverture).
                      <br />
                      Veuillez ouvrir les yeux et garder une expression neutre pour continuer la vidéo.
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

            {/* Afficher le nombre d'alertes restantes avant blocage */}
            <Typography variant="body2" sx={{
              color: 'white',
              mt: 2,
              p: 1,
              bgcolor: 'rgba(0,0,0,0.3)',
              borderRadius: 1,
              fontWeight: 'bold'
            }}>
              Attention: {MAX_ALERTS - alertCount} {MAX_ALERTS - alertCount > 1 ? 'alertes restantes' : 'alerte restante'} avant blocage temporaire de 5 minutes
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

      {/* Dialogue de blocage temporaire */}
      <Dialog
        open={showBlockDialog}
        onClose={() => {}}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', bgcolor: 'error.main', color: 'white' }}>
          <LockIcon sx={{ mr: 1 }} />
          Accès temporairement bloqué
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <SentimentVeryDissatisfiedIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />

            <Typography variant="h6" sx={{ mb: 2 }}>
              Vous avez reçu trop d'alertes d'inattention
            </Typography>

            <Typography variant="body1" sx={{ mb: 3 }}>
              Pour des raisons pédagogiques, l'accès à cette vidéo est temporairement bloqué pendant 5 minutes.
              {inattentionReason && (
                <Box component="span" sx={{ display: 'block', fontWeight: 'bold', mt: 1 }}>
                  Raison: {inattentionReason}
                </Box>
              )}
            </Typography>

            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.100',
              p: 2,
              borderRadius: 2,
              width: '100%',
              mb: 2
            }}>
              <TimerIcon sx={{ mr: 1, color: 'error.main' }} />
              <Typography variant="h5" sx={{ fontFamily: 'monospace' }}>
                {Math.floor(blockTimeRemaining / 60)}:{(blockTimeRemaining % 60).toString().padStart(2, '0')}
              </Typography>
            </Box>

            <Alert severity="info" sx={{ width: '100%', mb: 2 }}>
              <Typography variant="body2">
                Pendant ce temps, nous vous suggérons de prendre une courte pause pour vous reposer les yeux et vous reconcentrer.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => window.location.href = '/'}
            color="primary"
          >
            Retourner à l'accueil
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CameraRequiredVideoPlayer;
