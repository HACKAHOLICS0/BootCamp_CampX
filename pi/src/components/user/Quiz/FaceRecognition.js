import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Spinner, Alert } from 'react-bootstrap';
import config from '../../../config'; // Assurez-vous que ce fichier contient API_URL

export const FaceRecognition = ({ userImage, onVerificationComplete }) => {
    const videoRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false); // Évite les boucles infinies

    useEffect(() => {
        const loadModels = async () => {
            try {
                await Promise.all([
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
                ]);
                console.log("✅ Face API models loaded successfully!");
                startWebcam();
            } catch (err) {
                setError('❌ Erreur de chargement des modèles');
            }
        };

        loadModels();
    }, []);

    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            
            if (videoRef.current) {  // Vérifier si la référence est disponible
                videoRef.current.srcObject = stream;

                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    console.log("🎥 Webcam démarrée avec succès!");
                    detectFace(); // Lancer la détection après le démarrage de la webcam
                };
            } else {
                console.error("❌ videoRef.current is still null after assigning stream.");
            }
        } catch (err) {
            setError("❌ Impossible d'accéder à la caméra");
        }
    };

    const detectFace = async () => {
        if (isProcessing || !videoRef.current) return; // Vérification avant d'exécuter la fonction
        setIsProcessing(true);

        try {
            const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                console.warn("⚠️ Aucun visage détecté dans le flux vidéo.");
                setIsProcessing(false);
                return;
            }

            const userImageUrl = userImage.startsWith('http') ? userImage : `${config.API_URL}/${userImage}`;
            console.log("📸 Processing user image URL:", userImageUrl);

            const img = await faceapi.fetchImage(userImageUrl);
            if (!(img instanceof HTMLImageElement)) {
                console.error("❌ L'image téléchargée n'est pas valide:", img);
                setIsProcessing(false);
                return;
            }

            const referenceDetection = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!referenceDetection) {
                console.error("❌ Aucun visage détecté dans l'image de l'utilisateur.");
                setIsProcessing(false);
                return;
            }

            const distance = faceapi.euclideanDistance(referenceDetection.descriptor, detection.descriptor);
            console.log("🔍 Distance score:", distance);

            if (distance < 0.6) {
                console.log("✅ Utilisateur reconnu !");
                onVerificationComplete(true);
            } else {
                console.error("❌ Utilisateur non reconnu.");
            }
        } catch (error) {
            console.error("❌ Erreur lors de la détection faciale:", error);
        }

        setIsProcessing(false);
        requestAnimationFrame(detectFace);
    };

    return (
        <div>
            {error && <Alert variant="danger">{error}</Alert>}
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%' }} />
            {isLoading && <Spinner animation="border" />}
        </div>
    );
};
