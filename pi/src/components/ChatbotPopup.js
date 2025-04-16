import React, { useState, useEffect } from 'react';
import { FaComments, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import './ChatbotPopup.css';

const ChatbotPopup = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [user, setUser] = useState(null);
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

    const toggleChatbot = () => {
        setIsOpen(!isOpen);
    };

    const sendMessage = () => {
        if (!input.trim() || !user || !user.id) return;

        const newMessage = { role: "user", content: input };
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
            message: input,
            context: {
                userId: user.id,
                currentUrl: window.location.pathname
            }
        };

        console.log("Envoi de la requête au chatbot:", {
            url: "http://localhost:5001/predict",
            data: requestData,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        axios.post(
            "http://localhost:5001/predict",
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
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="Écrivez un message..."
                            />
                            <button onClick={sendMessage}>Envoyer</button>
                        </div>
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