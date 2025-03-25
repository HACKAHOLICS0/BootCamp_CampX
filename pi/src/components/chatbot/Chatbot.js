import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import "./Chatbot.css";
import ChatbotLogo from "../../assets/img/img.jpg";

const Chatbot = () => {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  // Récupérer l'utilisateur depuis les cookies
  useEffect(() => {
    const userCookie = Cookies.get("user");
    if (userCookie) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userCookie));
        setUser(parsedUser);
        console.log("✅ Utilisateur récupéré :", parsedUser);
      } catch (error) {
        console.error("❌ Erreur de parsing du cookie user:", error);
      }
    }
  }, []);

  // Charger les messages sauvegardés dans localStorage au chargement de la page
  useEffect(() => {
    if (user?.id) {
      const savedMessages = localStorage.getItem(`chatMessages_${user.id}`);
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          setMessages(Array.isArray(parsedMessages) ? parsedMessages : []);
        } catch (error) {
          console.error("❌ Erreur de parsing des messages sauvegardés:", error);
          setMessages([]);
        }
      } else {
        // Si aucun message n'est trouvé en local, récupérer depuis l'API
        axios
          .get(`http://localhost:5000/api/chat/conversations/user/${user.id}`, {
            headers: {
              Authorization: `Bearer ${Cookies.get("token")}`,
            },
          })
          .then((response) => {
            console.log("✅ Réponse API :", response.data);
            if (response.data.success && response.data.data) {
              const conversationMessages = response.data.data.messages || [];
              setMessages(conversationMessages);
            } else {
              setMessages([]);
            }
          })
          .catch((error) => {
            console.error("❌ Erreur API :", error.response?.data || error);
            setMessages([]);
          });
      }
    }
  }, [user]);

  // Sauvegarder les messages dans localStorage après chaque mise à jour
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`chatMessages_${user.id}`, JSON.stringify(messages));
    }
  }, [messages, user]);

  // Gérer les actions du chatbot
  const handleChatbotAction = (action, data) => {
    console.log("Action reçue:", action);
    console.log("Données reçues:", data);

    switch (action) {
      case "redirect_course":
        if (data?.courseId || data?.id) {
          const courseId = data.courseId || data.id;
          console.log("Redirection vers le cours:", courseId);
          // Rediriger vers l'URL complète du frontend React
          window.location.href = `http://localhost:3000/courses/${courseId}`;
        } else {
          console.error("❌ ID du cours manquant dans les données:", data);
        }
        break;
      case "list_courses":
        if (data?.courses) {
          console.log("Liste des cours :", data.courses);
        }
        break;
      case "await_course_name":
        break;
      default:
        console.log("Action non gérée:", action);
        break;
    }
  };

  // Envoyer un message au chatbot
  const sendMessage = () => {
    if (!input.trim()) return;
    if (!user || !user.id) {
      console.warn("❌ Impossible d'envoyer un message : user.id est undefined");
      return;
    }

    const newMessage = { role: "user", content: input };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInput("");  // Vider l'input après l'envoi

    // Ajouter un message temporaire du bot
    const tempBotMessage = { role: "bot", content: "..." };
    setMessages(prevMessages => [...prevMessages, tempBotMessage]);

    const token = Cookies.get("token");
    if (!token) {
      console.error("❌ Pas de token d'authentification trouvé");
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.content !== "...").concat([
          { 
            role: "bot", 
            content: "Erreur d'authentification. Veuillez vous reconnecter." 
          }
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

    axios
      .post(
        "http://localhost:5001/predict",
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000 // Timeout de 10 secondes
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
            if (courseId) {
              console.log("Redirection vers le cours:", courseId);
              // Attendre un peu pour que l'utilisateur puisse lire la réponse
              setTimeout(() => {
                navigate(`/courses/${courseId}`);
              }, 1500);
            } else {
              console.error("❌ ID du cours manquant dans les données de redirection:", responseData);
            }
          }
        } else {
          console.error("❌ Réponse invalide du serveur:", response.data);
          const errorMessage = { 
            role: "bot", 
            content: "Désolé, je n'ai pas pu comprendre votre demande. Pouvez-vous reformuler ?"
          };
          setMessages(prevMessages => [...prevMessages, errorMessage]);
        }
      })
      .catch((error) => {
        console.error("❌ Erreur lors de l'envoi du message:", error);
        console.error("Détails de l'erreur:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        // Supprimer le message temporaire
        setMessages(prevMessages => prevMessages.filter(msg => msg.content !== "..."));
        
        // Message d'erreur personnalisé en fonction du type d'erreur
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

  // Obtenir le cours actuel si on est sur une page de cours
  const getCurrentCourse = () => {
    const match = window.location.pathname.match(/\/course\/([^/]+)/);
    return match ? match[1] : null;
  };

  // Fonction de déconnexion avec suppression des messages enregistrés
  const logout = () => {
    Cookies.remove("user");
    Cookies.remove("token");
    if (user?.id) {
      localStorage.removeItem(`chatMessages_${user.id}`);
    }
    setUser(null);
    setMessages([]);
  };

  return (
    <div className="chat-container">
      <div className="chat-logo-container">
        <img src={ChatbotLogo} alt="Chatbot Logo" className="chat-logo" />
      </div>

      <h2>Chatbot</h2>
      {user ? (
        <div className="chat-box">
          <div className="messages">
            {Array.isArray(messages) && messages.map((msg, index) => (
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
      ) : (
        <p>Veuillez vous connecter pour utiliser le chatbot.</p>
      )}
    </div>
  );
};

export default Chatbot;
