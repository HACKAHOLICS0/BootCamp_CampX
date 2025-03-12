import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Spinner, Alert, Modal, Button } from 'react-bootstrap';
import config from '../../../config';
import './FaceRecognition.css';

export const FaceRecognition = ({ userImage, onVerificationComplete }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const overlayRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Initialisation...');
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalVariant, setModalVariant] = useState('danger');
    const [faceDistanceMessage, setFaceDistanceMessage] = useState('');
    const [lastDetection, setLastDetection] = useState(null);
    const [scanProgress, setScanProgress] = useState(0);
    const [matchPercentage, setMatchPercentage] = useState(0);
    const [scanStatus, setScanStatus] = useState('');
    const [verificationStartTime, setVerificationStartTime] = useState(null);
    const [successfulMatches, setSuccessfulMatches] = useState(0);
    const REQUIRED_MATCHES = 3; // Nombre de correspondances successives requises
    const VERIFICATION_TIME = 10; // Changé à 10 secondes
    const [isVerified, setIsVerified] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState(VERIFICATION_TIME);

    const formatTime = (seconds) => {
        return Math.max(0, Math.ceil(seconds));
    };

    useEffect(() => {
        const loadModels = async () => {
            try {
                setLoadingMessage('Chargement des modèles...');
                // Essayer d'abord le chargement local
                try {
                    console.log("📂 Tentative de chargement depuis le dossier local...");
                    setLoadingMessage('Tentative de chargement local...');
                    await Promise.all([
                        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
                        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                        faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
                        faceapi.nets.tinyFaceDetector.loadFromUri('/models')
                    ]);
                    console.log("✅ Modèles chargés depuis le dossier local!");
                    setLoadingMessage('Modèles chargés, démarrage de la webcam...');
                    await startWebcam();
                } catch (localErr) {
                    console.error("❌ Échec du chargement local:", localErr);
                    
                    // Si le chargement local échoue, essayer le CDN
                    try {
                        const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
                        console.log("🌐 Tentative de chargement depuis:", MODEL_URL);
                        setLoadingMessage('Chargement des modèles depuis internet...');
                        
                        await Promise.all([
                            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
                        ]);
                        console.log("✅ Modèles chargés depuis le CDN!");
                        setLoadingMessage('Modèles chargés, démarrage de la webcam...');
                        await startWebcam();
                    } catch (cdnErr) {
                        console.error("❌ Échec du chargement depuis le CDN:", cdnErr);
                        throw new Error('Impossible de charger les modèles');
                    }
                }
            } catch (err) {
                console.error("❌ Erreur globale:", err);
                setError('❌ Impossible de charger les modèles. Veuillez vérifier votre connexion internet et rafraîchir la page.');
                setIsLoading(false);
            }
        };

        loadModels();

        return () => {
            setIsVerified(true);
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []);

    useEffect(() => {
        let timer;
        if (verificationStartTime && !isVerified) {
            timer = setInterval(() => {
                const currentTime = Date.now();
                const elapsedTime = (currentTime - verificationStartTime) / 1000;
                const remaining = Math.max(0, VERIFICATION_TIME - elapsedTime);
                setRemainingSeconds(remaining);
                
                // Si le temps est écoulé
                if (remaining <= 0) {
                    clearInterval(timer);
                    
                    if (matchPercentage >= 70) {
                        setScanStatus('✅ Visage vérifié !');
                        setIsVerified(true);
                        setTimeout(() => {
                            onVerificationComplete(true);
                        }, 1000);
                    } else {
                        setScanStatus('❌ Vérification échouée');
                        setShowModal(true);
                        setModalMessage("Vous n'êtes pas la même personne que sur la photo de profil. Veuillez réessayer.");
                        setVerificationStartTime(null);
                        setIsVerified(false);
                    }
                }
            }, 100); // Mise à jour plus fréquente
        }
        return () => {
            if (timer) {
                clearInterval(timer);
            }
        };
    }, [verificationStartTime, isVerified, matchPercentage, onVerificationComplete]);

    const startWebcam = async () => {
        try {
            console.log("🎥 Démarrage de la webcam...");
            setLoadingMessage('Activation de la caméra...');
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user"
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    console.log("✅ Webcam démarrée avec succès!");
                    videoRef.current.play();
                    setIsLoading(false);
                    setLoadingMessage('');
                    setIsVerified(false);
                    setVerificationStartTime(Date.now());
                    setRemainingSeconds(VERIFICATION_TIME);
                    setScanStatus('Vérification en cours...');
                    detectFace();
                };
            }
        } catch (err) {
            console.error("❌ Erreur d'accès à la caméra:", err);
            setError("❌ Impossible d'accéder à la caméra. Veuillez vérifier les permissions.");
            setIsLoading(false);
        }
    };

    const drawFaceFrame = (detection, canvas, displaySize) => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Ajuster la taille de la boîte de détection
        const box = detection.detection.box;
        const drawBox = {
            x: box.x - (box.width * 0.15),
            y: box.y - (box.height * 0.15),
            width: box.width * 1.3,
            height: box.height * 1.3
        };
        
        // Redimensionner la boîte selon la taille d'affichage
        const resizedBox = faceapi.resizeResults(drawBox, displaySize);
        
        // Effet de scan lumineux
        const gradient = ctx.createLinearGradient(0, resizedBox.y, 0, resizedBox.y + resizedBox.height);
        gradient.addColorStop(0, 'rgba(0, 255, 0, 0.15)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 0, 0.05)');
        gradient.addColorStop(1, 'rgba(0, 255, 0, 0.15)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(resizedBox.x, resizedBox.y, resizedBox.width, resizedBox.height);
        
        // Cadre principal avec coins arrondis
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(resizedBox.x, resizedBox.y, resizedBox.width, resizedBox.height, 10);
        ctx.stroke();
        
        // Points de repère avec taille réduite
        const landmarks = detection.landmarks.positions;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.6)';
        for (let i = 0; i < landmarks.length; i++) {
            const point = faceapi.resizeResults(landmarks[i], displaySize);
            ctx.beginPath();
            ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // Ligne de scan
        const scanLineY = resizedBox.y + (resizedBox.height * (scanProgress / 100));
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(resizedBox.x, scanLineY);
        ctx.lineTo(resizedBox.x + resizedBox.width, scanLineY);
        ctx.stroke();
    };

    const detectFace = async () => {
        if (isProcessing || !videoRef.current || isVerified) return;
        setIsProcessing(true);

        try {
            const detections = await faceapi.detectAllFaces(
                videoRef.current,
                new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
            ).withFaceLandmarks().withFaceDescriptors();

            if (detections.length === 0) {
                setScanStatus('Aucun visage détecté');
                setFaceDistanceMessage(`Placez votre visage dans le cadre (${formatTime(remainingSeconds)}s)`);
                setMatchPercentage(0);
                
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                }
            } else {
                // Setup canvas
                if (!canvasRef.current) {
                    const canvas = faceapi.createCanvasFromMedia(videoRef.current);
                    canvas.style.position = 'absolute';
                    canvas.style.top = '0';
                    canvas.style.left = '0';
                    canvasRef.current = canvas;
                    videoRef.current.parentNode.appendChild(canvas);
                }

                const displaySize = {
                    width: videoRef.current.videoWidth,
                    height: videoRef.current.videoHeight
                };
                faceapi.matchDimensions(canvasRef.current, displaySize);

                setScanProgress(prev => (prev + 2) % 100);
                drawFaceFrame(detections[0], canvasRef.current, displaySize);

                // Vérification du visage
                if (userImage) {
                    const userImageUrl = userImage.startsWith('http') ? userImage : `${config.API_URL}/${userImage}`;
                    const img = await faceapi.fetchImage(userImageUrl);
                    
                    const referenceDetection = await faceapi.detectSingleFace(
                        img,
                        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
                    ).withFaceLandmarks().withFaceDescriptor();

                    if (referenceDetection) {
                        const distance = faceapi.euclideanDistance(
                            referenceDetection.descriptor,
                            detections[0].descriptor
                        );
                        
                        const maxDistance = 1.0;
                        const minDistance = 0.3;
                        const normalizedDistance = Math.max(0, Math.min(1, (distance - minDistance) / (maxDistance - minDistance)));
                        const percentage = (1 - normalizedDistance) * 100;
                        const roundedPercentage = Math.round(percentage);
                        setMatchPercentage(roundedPercentage);

                        // Afficher le temps restant qui diminue
                        setScanStatus(`Analyse en cours... ${roundedPercentage}%`);
                        setFaceDistanceMessage(`Temps restant : ${formatTime(remainingSeconds)} secondes`);
                    }
                }

                setLastDetection(detections[0]);
            }
        } catch (error) {
            console.error("❌ Erreur lors de la détection faciale:", error);
        }

        setIsProcessing(false);
        if (!isVerified) {
            requestAnimationFrame(detectFace);
        }
    };

    return (
        <div className="face-recognition-container">
            {error && <Alert variant="danger">{error}</Alert>}
            
            <div className="video-container">
                <video 
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        transform: 'scaleX(-1)'
                    }}
                />
                
                <div className="scan-status">
                    {scanStatus}
                    {matchPercentage > 0 && (
                        <div className="match-percentage">
                            Correspondance: {matchPercentage}% ({formatTime(remainingSeconds)}s)
                        </div>
                    )}
                </div>
                
                {isLoading && (
                    <div className="loading-container">
                        <Spinner animation="border" />
                        <p>{loadingMessage}</p>
                    </div>
                )}
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Vérification échouée</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalMessage}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => {
                        setShowModal(false);
                        setVerificationStartTime(null);
                        setIsVerified(false);
                    }}>
                        Réessayer
                    </Button>
                </Modal.Footer>
            </Modal>

            <div className="status-container">
                {faceDistanceMessage && (
                    <Alert variant="info">
                        {faceDistanceMessage}
                    </Alert>
                )}
            </div>
        </div>
    );
};
