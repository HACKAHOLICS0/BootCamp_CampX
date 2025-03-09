import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Spinner, Alert, Modal, Button } from 'react-bootstrap';
import config from '../../../config'; // Vérifie que API_URL est correct

export const FaceRecognition = ({ userImage, onVerificationComplete }) => {
    const videoRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalVariant, setModalVariant] = useState('danger'); // 'success' ou 'danger'

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

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    console.log("🎥 Webcam démarrée avec succès!");
                    detectFace();
                };
            } else {
                console.error("❌ videoRef.current is null.");
            }
        } catch (err) {
            setError("❌ Impossible d'accéder à la caméra");
        }
    };

    const detectFace = async () => {
        if (isProcessing || !videoRef.current) return;
        setIsProcessing(true);

        try {
            // 🟢 1. Détection du visage en direct
            const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                console.warn("⚠️ Aucun visage détecté.");
                setIsProcessing(false);
                return;
            }

            // 🟢 2. Charger l’image de profil de l’utilisateur
            const userImageUrl = userImage.startsWith('http') ? userImage : `${config.API_URL}/${userImage}`;
            console.log("📸 Processing user image URL:", userImageUrl);

            const img = await faceapi.fetchImage(userImageUrl);
            if (!img || !(img instanceof HTMLImageElement)) {
                console.error("❌ L'image utilisateur ne s'est pas chargée correctement.");
                setIsProcessing(false);
                return;
            }

            // 🟢 3. Détection du visage sur l’image de profil
            const referenceDetection = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!referenceDetection) {
                console.error("❌ Aucun visage détecté dans l'image utilisateur.");
                setIsProcessing(false);
                return;
            }

            // 🟢 4. Comparaison des visages
            const distance = faceapi.euclideanDistance(referenceDetection.descriptor, detection.descriptor);
            console.log(`🔍 Distance mesurée : ${distance} (Seuil: 0.5)`);

            if (distance < 0.5) { // Seuil plus strict pour éviter les faux positifs
                console.log("✅ Visage reconnu !");
                setModalMessage("✅ Vérification réussie ! Vous pouvez accéder au quiz.");
                setModalVariant("success");
                setShowModal(true);
                setTimeout(() => {
                    setShowModal(false);
                    onVerificationComplete(true);
                }, 2000); // Ferme après 2 secondes
            } else {
                console.error("❌ Visage non reconnu !");
                setModalMessage("❌ Vérification échouée ! Visage incorrect.");
                setModalVariant("danger");
                setShowModal(true);
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

            {/* Popup de vérification */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Body className={`text-center text-${modalVariant}`}>
                    {modalMessage}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant={modalVariant} onClick={() => setShowModal(false)}>
                        Fermer
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};
