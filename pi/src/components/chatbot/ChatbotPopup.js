import React, { useState, useEffect, useRef } from 'react';
import { FaComments, FaTimes, FaMicrophone, FaStop } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import './ChatbotPopup.css';

const ChatbotPopup = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [user, setUser] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [speechError, setSpeechError] = useState(null);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = Cookies.get("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        // Charger les messages précédents du localStorage
        if (user?.id) {
            const savedMessages = localStorage.getItem(`chatMessages_${user.id}`);
            if (savedMessages) {
                setMessages(JSON.parse(savedMessages));
            }
        }
    }, [user]);

    // Sauvegarder les messages dans le localStorage
    useEffect(() => {
        if (user?.id && messages.length > 0) {
            localStorage.setItem(`chatMessages_${user.id}`, JSON.stringify(messages));
        }
    }, [messages, user]);

    // Initialiser la reconnaissance vocale
    useEffect(() => {
        // Vérifier si la reconnaissance vocale est supportée par le navigateur
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setSpeechError('La reconnaissance vocale n\'est pas supportée par votre navigateur.');
            return;
        }

        // Créer l'objet de reconnaissance vocale
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();

        // Configurer la reconnaissance vocale
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'fr-FR'; // Définir la langue sur français

        // Gérer les résultats de la reconnaissance
        recognitionRef.current.onresult = (event) => {
            try {
                const current = event.resultIndex;
                const transcriptText = event.results[current][0].transcript;
                console.log('Texte reconnu:', transcriptText);
                console.log('Type du texte reconnu:', typeof transcriptText);

                // S'assurer que le texte est une chaîne de caractères
                if (typeof transcriptText === 'string') {
                    setTranscript(transcriptText);

                    // Si le résultat est final, mettre à jour l'input
                    if (event.results[current].isFinal) {
                        setInput(transcriptText);
                    }
                } else {
                    console.error('Le texte reconnu n\'est pas une chaîne de caractères:', transcriptText);
                }
            } catch (error) {
                console.error('Erreur lors du traitement des résultats de reconnaissance vocale:', error);
            }
        };

        // Gérer la fin de la reconnaissance
        recognitionRef.current.onend = () => {
            setIsListening(false);
        };

        // Gérer les erreurs
        recognitionRef.current.onerror = (event) => {
            console.error('Erreur de reconnaissance vocale:', event.error);
            setSpeechError(`Erreur: ${event.error}`);
            setIsListening(false);
        };

        // Nettoyer lors du démontage du composant
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    // Fonction pour démarrer/arrêter la reconnaissance vocale
    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);

            // Si un texte a été reconnu, l'envoyer automatiquement
            if (typeof transcript === 'string' && transcript.trim()) {
                sendMessage(transcript);
                setTranscript('');
            }
        } else {
            setSpeechError(null);
            setTranscript('');
            recognitionRef.current.start();
            setIsListening(true);

            // Arrêter automatiquement l'écoute après 10 secondes
            setTimeout(() => {
                if (isListening && recognitionRef.current) {
                    recognitionRef.current.stop();
                }
            }, 10000);
        }
    };

    const toggleChatbot = () => {
        setIsOpen(!isOpen);
    };

    const sendMessage = (messageText = null) => {
        console.log('sendMessage appelé avec messageText:', messageText);
        console.log('Type de messageText:', typeof messageText);
        console.log('Valeur actuelle de input:', input);

        const messageContent = messageText || input;
        console.log('messageContent calculé:', messageContent);
        console.log('Type de messageContent:', typeof messageContent);

        // Vérifier que messageContent est une chaîne de caractères
        if (typeof messageContent !== 'string' || !messageContent.trim() || !user || !user.id) {
            console.error('Message invalide ou utilisateur non connecté', { messageContent, user });
            return;
        }

        const newMessage = { role: "user", content: messageContent };
        setMessages(prevMessages => [...prevMessages, newMessage]);
        setInput("");

        const tempBotMessage = { role: "bot", content: "..." };
        setMessages(prevMessages => [...prevMessages, tempBotMessage]);

        const token = Cookies.get("token");
        if (!token) {
            console.error("❌ Pas de token d'authentification trouvé");
            setMessages(prevMessages =>
                prevMessages.filter(msg => msg.content !== "...").concat([
                    { role: "bot", content: "Erreur d'authentification. Veuillez vous reconnecter." }
                ])
            );
            return;
        }

        const requestData = {
            message: messageContent,
            context: {
                userId: user.id,
                currentUrl: window.location.pathname
            }
        };

        // Déterminer l'URL du service chatbot
        const chatbotUrl = "http://localhost:5001/predict";

        console.log("Envoi de la requête au chatbot:", {
            url: chatbotUrl,
            data: requestData,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        axios.post(
            chatbotUrl,
            requestData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                timeout: 10000
            }
        )
        .then((response) => {
            console.log("Réponse du chatbot:", response.data);

            // Supprimer le message temporaire
            setMessages(prevMessages => prevMessages.filter(msg => msg.content !== "..."));

            if (response.data.success && response.data.data) {
                const responseData = response.data.data;

                // Ajouter le message du bot
                const botMessage = {
                    role: "bot",
                    content: responseData.response || "Désolé, je n'ai pas compris."
                };
                setMessages(prevMessages => [...prevMessages, botMessage]);

                // Gérer la redirection vers un cours
                if (responseData.action === "redirect_course" && responseData.shouldRedirect) {
                    const courseId = responseData.redirect_data?.courseId;
                    const categoryId = responseData.redirect_data?.categoryId;
                    const moduleId = responseData.redirect_data?.moduleId;
                    if (courseId && categoryId && moduleId) {
                        console.log("Redirection vers le cours:", courseId);
                        // Attendre un peu pour que l'utilisateur puisse lire la réponse
                        setTimeout(() => {
                            navigate(`/categories/${categoryId}/modules/${moduleId}`);
                            setIsOpen(false); // Fermer le popup après la redirection
                        }, 1500);
                    } else {
                        console.error("❌ Données de redirection manquantes:", responseData);
                    }
                }
            }
        })
        .catch((error) => {
            console.error("❌ Erreur lors de l'envoi du message:", error);
            console.error("Détails de l'erreur:", {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });

            setMessages(prevMessages => prevMessages.filter(msg => msg.content !== "..."));

            let errorMessage = {
                role: "bot",
                content: "Désolé, une erreur s'est produite lors de la communication avec le serveur."
            };

            if (error.code === "ECONNABORTED") {
                errorMessage.content = "Le serveur met trop de temps à répondre. Veuillez réessayer.";
            } else if (error.response?.status === 401) {
                errorMessage.content = "Votre session a expiré. Veuillez vous reconnecter.";
            } else if (error.response?.status === 404) {
                errorMessage.content = "Le service de chatbot n'est pas accessible pour le moment.";
            } else if (!error.response) {
                errorMessage.content = "Impossible de contacter le serveur. Vérifiez votre connexion.";
            }

            setMessages(prevMessages => [...prevMessages, errorMessage]);
        });
    };

    return (
        <div className="chatbot-popup-container">
            {isOpen ? (
                <div className="chatbot-popup">
                    <div className="chatbot-header">
                        <h3>Chatbot Assistant</h3>
                        <button onClick={toggleChatbot} className="close-button">
                            <FaTimes />
                        </button>
                    </div>
                    <div className="chatbot-content">
                        <div className="messages">
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={msg.role === "user" ? "message user" : "message bot"}
                                >
                                    {msg.content}
                                </div>
                            ))}
                        </div>
                        <div className="input-box">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder={isListening ? 'Je vous écoute...' : 'Écrivez un message...'}
                                className={isListening ? 'listening' : ''}
                            />
                            <button
                                className={`voice-button ${isListening ? 'listening' : ''}`}
                                onClick={toggleListening}
                                title={isListening ? 'Arrêter lécoute' : 'Parler'}
                            >
                                {isListening ? <FaStop /> : <FaMicrophone />}
                            </button>
                            <button onClick={() => sendMessage()}>Envoyer</button>
                        </div>
                        {speechError && (
                            <div className="speech-error">{speechError}</div>
                        )}
                        {transcript && isListening && (
                            <div className="transcript-container">
                                <div className="transcript">{transcript}</div>
                                <button
                                    className="send-transcript-button"
                                    onClick={() => {
                                        if (typeof transcript === 'string' && transcript.trim()) {
                                            sendMessage(transcript);
                                            setTranscript('');
                                        }
                                    }}
                                >
                                    Envoyer
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <button onClick={toggleChatbot} className="chatbot-trigger">
                    <FaComments />
                </button>
            )}
        </div>
    );
};

export default ChatbotPopup;