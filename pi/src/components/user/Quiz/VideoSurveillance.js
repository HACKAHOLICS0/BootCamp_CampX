import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Alert, Badge, Spinner, Button } from 'react-bootstrap';
import { downloadAllModels } from '../../../utils/faceApiModels';
import './VideoSurveillance.css';

const VideoSurveillance = ({ onFraudDetected }) => {
  const videoRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [fraudDetected, setFraudDetected] = useState(false);
  const [fraudType, setFraudType] = useState(null);
  const [error, setError] = useState(null);
  const [isDownloadingModels, setIsDownloadingModels] = useState(false);

  // Utiliser useRef pour les compteurs pour qu'ils persistent entre les rendus
  const noFaceCount = useRef(0);
  const faceTurnedCount = useRef(0);

  // Constantes
  const FRAUD_CHECK_INTERVAL = 500; // Vérifier la fraude toutes les 0.5 secondes (très fréquent)
  const NO_FACE_THRESHOLD = 3; // Nombre de détections consécutives sans visage avant de signaler une fraude
  const FACE_TURNED_THRESHOLD = 3; // Nombre de détections consécutives avec visage tourné avant de signaler une fraude

  // Références
  const lastFraudCheck = useRef(0);
  const isComponentMounted = useRef(true); // Pour suivre si le composant est monté

  // Charger les modèles de détection de visage
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log("Chargement des modèles de détection de visage...");

        // Vérifier si les modèles sont disponibles
        const checkModelAvailability = async (url) => {
          try {
            const response = await fetch(url);
            return response.ok;
          } catch (error) {
            return false;
          }
        };

        // Essayer d'abord avec le chemin absolu
        const MODEL_URL = '/models';
        const modelAvailable = await checkModelAvailability(`${MODEL_URL}/tiny_face_detector_model-weights_manifest.json`);

        if (!modelAvailable) {
          console.warn("Modèles non trouvés dans /models, tentative de téléchargement automatique...");

          // Télécharger les modèles automatiquement
          setIsDownloadingModels(true);
          setError("Téléchargement automatique des modèles en cours...");

          try {
            // Télécharger tous les modèles
            const success = await downloadAllModels();

            if (!success) {
              throw new Error("Échec du téléchargement automatique des modèles.");
            }

            setIsDownloadingModels(false);
            setError(null);

            // Charger les modèles depuis le chemin absolu après téléchargement
            await Promise.all([
              faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
              faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
              faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
              faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
            ]);

          } catch (downloadError) {
            console.error("Erreur lors du téléchargement automatique des modèles:", downloadError);
            setIsDownloadingModels(false);
            throw new Error("Impossible de télécharger automatiquement les modèles. Veuillez rafraîchir la page pour réessayer.");
          }
        } else {
          // Charger les modèles depuis le chemin absolu
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
          ]);
        }

        console.log("Modèles chargés avec succès");
        setModelsLoaded(true);
        setError(null);
      } catch (err) {
        console.error("Erreur lors du chargement des modèles:", err);
        setError(err.message || "Impossible de charger les modèles de détection de visage.");
      }
    };

    loadModels();
  }, []);

  // Démarrer la webcam
  useEffect(() => {
    // Réinitialiser l'état du composant
    isComponentMounted.current = true;
    noFaceCount.current = 0;
    faceTurnedCount.current = 0;

    console.log("Initialisation du composant VideoSurveillance");

    const startWebcam = async () => {
      try {
        console.log("Démarrage de la webcam...");

        // Vérifier si le composant est toujours monté
        if (!isComponentMounted.current) {
          console.log("Composant démonté avant le démarrage de la webcam");
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user"
          },
          audio: false
        });

        // Vérifier à nouveau si le composant est toujours monté
        if (!isComponentMounted.current || !videoRef.current) {
          console.log("Composant démonté pendant le démarrage de la webcam");
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          return;
        }

        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          // Vérifier encore une fois si le composant est monté
          if (!isComponentMounted.current) {
            console.log("Composant démonté après chargement de la vidéo");
            return;
          }

          console.log("Webcam démarrée avec succès!");
          videoRef.current.play();
          setIsRecording(true);

          // Petit délai avant de démarrer la détection pour s'assurer que la vidéo est bien chargée
          setTimeout(() => {
            if (isComponentMounted.current) {
              console.log("Démarrage de la détection de fraude");
              detectFraud();
            }
          }, 500);
        };
      } catch (err) {
        console.error("Erreur d'accès à la caméra:", err);
        setError("Impossible d'accéder à la caméra. Veuillez vérifier les permissions.");
      }
    };

    // Petit délai avant de démarrer la webcam pour s'assurer que le composant est bien monté
    const timer = setTimeout(() => {
      if (modelsLoaded && isComponentMounted.current) {
        startWebcam();
      }
    }, 500);

    return () => {
      // Nettoyer le timer
      clearTimeout(timer);

      // Marquer le composant comme démonté
      isComponentMounted.current = false;

      // Arrêter la webcam
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }

      console.log("Composant VideoSurveillance démonté, arrêt de la détection");
    };
  }, [modelsLoaded]);

  // Fonction pour détecter la fraude
  const detectFraud = async () => {
    // Vérifier si le composant est toujours monté
    if (!isComponentMounted.current) {
      console.log("Composant démonté, arrêt de la détection");
      return;
    }

    // Vérifier si la vidéo est disponible
    if (!videoRef.current || !videoRef.current.srcObject || !modelsLoaded) {
      // Si le composant est toujours monté mais la vidéo n'est pas disponible,
      // continuer à vérifier mais moins fréquemment
      setTimeout(() => requestAnimationFrame(detectFraud), 1000);
      return;
    }

    try {
      // Vérifier si le temps écoulé depuis la dernière vérification est suffisant
      const now = Date.now();
      if (now - lastFraudCheck.current < FRAUD_CHECK_INTERVAL) {
        requestAnimationFrame(detectFraud);
        return;
      }

      lastFraudCheck.current = now;

      // Détecter les visages avec des options plus sensibles
      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,    // Taille d'entrée plus petite pour une détection plus rapide
          scoreThreshold: 0.3 // Seuil de confiance plus bas pour détecter plus facilement les visages
        })
      ).withFaceLandmarks().withFaceExpressions();

      // Vérifier si la vidéo est toujours active
      if (!videoRef.current || !videoRef.current.videoWidth) {
        console.log("Vidéo non disponible, arrêt de la détection");
        return;
      }

      // Afficher le nombre de visages détectés
      console.log("Nombre de visages détectés:", detections.length);

      // Vérifier s'il y a des visages détectés
      if (detections.length === 0) {
        // Aucun visage détecté - incrémenter le compteur
        noFaceCount.current += 1;
        console.log("Aucun visage détecté - compteur:", noFaceCount.current);

        // Ne signaler une fraude que si le seuil est atteint
        if (noFaceCount.current >= NO_FACE_THRESHOLD) {
          console.log("FRAUDE DÉTECTÉE: Aucun visage dans le cadre pendant trop longtemps");
          setFraudDetected(true);
          setFraudType('NO_FACE');

          if (onFraudDetected && typeof onFraudDetected === 'function') {
            try {
              onFraudDetected({
                type: 'NO_FACE',
                details: 'Aucun visage détecté dans le cadre',
                timestamp: Date.now()
              });
            } catch (error) {
              console.error("Erreur lors de l'appel à onFraudDetected:", error);
            }
          }
        }
      } else if (detections.length > 1) {
        // Plusieurs visages détectés - fraude immédiate
        noFaceCount.current = 0; // Réinitialiser le compteur
        setFraudDetected(true);
        setFraudType('MULTIPLE_FACES');

        if (onFraudDetected && typeof onFraudDetected === 'function') {
          try {
            onFraudDetected({
              type: 'MULTIPLE_FACES',
              details: `${detections.length} visages détectés`,
              timestamp: Date.now()
            });
          } catch (error) {
            console.error("Erreur lors de l'appel à onFraudDetected:", error);
          }
        }
      } else {
        // Un seul visage détecté
        noFaceCount.current = 0; // Réinitialiser le compteur

        const landmarks = detections[0].landmarks;
        const jawOutline = landmarks.getJawOutline();

        // Calculer l'angle de rotation du visage
        const leftPoint = jawOutline[0];
        const rightPoint = jawOutline[16];
        const angle = Math.atan2(rightPoint.y - leftPoint.y, rightPoint.x - leftPoint.x) * 180 / Math.PI;

        // Vérifier si les deux yeux sont visibles
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        // Calculer la distance entre les yeux
        const leftEyeCenter = {
          x: leftEye.reduce((sum, point) => sum + point.x, 0) / leftEye.length,
          y: leftEye.reduce((sum, point) => sum + point.y, 0) / leftEye.length
        };

        const rightEyeCenter = {
          x: rightEye.reduce((sum, point) => sum + point.x, 0) / rightEye.length,
          y: rightEye.reduce((sum, point) => sum + point.y, 0) / rightEye.length
        };

        // Distance entre les yeux
        const eyeDistance = Math.sqrt(
          Math.pow(rightEyeCenter.x - leftEyeCenter.x, 2) +
          Math.pow(rightEyeCenter.y - leftEyeCenter.y, 2)
        );

        // Taille du visage (largeur)
        const faceBox = detections[0].detection.box;
        const faceWidth = faceBox.width;

        // Ratio entre la distance des yeux et la largeur du visage
        // Si le visage est de face, ce ratio devrait être d'environ 0.3-0.5
        // S'il est tourné, ce ratio sera plus petit
        const eyeRatio = eyeDistance / faceWidth;

        console.log("Distance entre les yeux:", eyeDistance.toFixed(2), "Largeur du visage:", faceWidth.toFixed(2), "Ratio:", eyeRatio.toFixed(2));

        // Vérifier si le visage est tourné (ratio des yeux trop petit)
        // Un ratio inférieur à 0.25 indique généralement que le visage est tourné
        if (eyeRatio < 0.25) {
          // Incrémenter le compteur de visage tourné
          faceTurnedCount.current += 1;
          console.log("Visage tourné - compteur:", faceTurnedCount.current);

          // Ne signaler une fraude que si le seuil est atteint
          if (faceTurnedCount.current >= FACE_TURNED_THRESHOLD) {
            console.log("FRAUDE DÉTECTÉE: Visage tourné pendant trop longtemps");
            setFraudDetected(true);
            setFraudType('FACE_TURNED');

            if (onFraudDetected && typeof onFraudDetected === 'function') {
              try {
                onFraudDetected({
                  type: 'FACE_TURNED',
                  details: `Visage tourné ou hors cadre (ratio des yeux: ${eyeRatio.toFixed(2)})`,
                  timestamp: Date.now()
                });
              } catch (error) {
                console.error("Erreur lors de l'appel à onFraudDetected:", error);
              }
            }
          }
        } else {
          // Réinitialiser le compteur si le visage n'est pas tourné
          faceTurnedCount.current = 0;

          // Pas de fraude détectée
          if (fraudType === 'FACE_TURNED') {
            setFraudDetected(false);
            setFraudType(null);
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la détection de fraude:", error);
    }

    // Continuer la détection seulement si le composant est toujours monté
    if (isComponentMounted.current) {
      requestAnimationFrame(detectFraud);
    } else {
      console.log("Composant démonté après détection, arrêt de la boucle");
    }
  };

  return (
    <div className="video-surveillance">
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="video-container">
        {!modelsLoaded ? (
          <div className="loading-container">
            <Spinner animation="border" role="status" />
            <p className="loading-text">Chargement des modèles de détection...</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="surveillance-video"
            />

            {isRecording && (
              <div className="recording-indicator">
                <span className="recording-dot"></span>
                REC
                {!fraudDetected && noFaceCount.current > 0 && noFaceCount.current < NO_FACE_THRESHOLD && (
                  <Badge bg="info" className="warning-badge">
                    Attention: Visage non détecté ({noFaceCount.current}/{NO_FACE_THRESHOLD})
                  </Badge>
                )}
                {!fraudDetected && faceTurnedCount.current > 0 && faceTurnedCount.current < FACE_TURNED_THRESHOLD && (
                  <Badge bg="info" className="warning-badge">
                    Attention: Visage tourné ({faceTurnedCount.current}/{FACE_TURNED_THRESHOLD})
                  </Badge>
                )}
                {fraudDetected && (
                  <Badge bg="warning" className="fraud-badge">
                    {fraudType === 'NO_FACE' && 'Visage non détecté'}
                    {fraudType === 'MULTIPLE_FACES' && 'Plusieurs personnes détectées'}
                    {fraudType === 'FACE_TURNED' && 'Visage tourné ou hors cadre'}
                  </Badge>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VideoSurveillance;
