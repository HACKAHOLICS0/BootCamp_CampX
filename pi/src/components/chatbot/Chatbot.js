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

    // Ajouter un message temporaire du bot
    const tempBotMessage = { role: "bot", content: "..." };
    setMessages(prevMessages => [...prevMessages, tempBotMessage]);

    console.log("Envoi de la requête au chatbot avec les données:", {
      message: input,
      context: {
        userId: user.id,
        currentUrl: window.location.pathname,
        currentCourse: getCurrentCourse()
      }
    });

    axios
      .post(
        "http://localhost:5001/predict",
        { 
          message: input,
          context: {
            userId: user.id,
            currentUrl: window.location.pathname,
            currentCourse: getCurrentCourse()
          }
        },
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("token")}`,
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        console.log("Réponse brute du chatbot:", response);
        console.log("Données de la réponse:", response.data);
        
        // Supprimer le message temporaire
        setMessages(prevMessages => prevMessages.filter(msg => msg.content !== "..."));
        
        if (response.data.success && response.data.data) {
          const responseData = response.data.data;
          console.log("Données de réponse traitées:", responseData);
          
          // Ajouter le message du bot
          const botMessage = { 
            role: "bot", 
            content: responseData.response || "Désolé, je n'ai pas compris."
          };
          setMessages(prevMessages => [...prevMessages, botMessage]);

          // Gérer la redirection
          if (responseData.action === "redirect_course" && responseData.shouldRedirect) {
            console.log("Tentative de redirection avec les données:", responseData);
            const redirectData = responseData.redirect_data || responseData.course_data;
            if (redirectData) {
              console.log("Données de redirection:", redirectData);
              const courseId = redirectData.courseId || redirectData.id;
              if (courseId) {
                console.log("Redirection vers le cours:", courseId);
                window.location.href = `http://localhost:3000/courses/${courseId}`;
              } else {
                console.error("❌ ID du cours manquant dans les données de redirection");
              }
            } else {
              console.error("❌ Données de redirection manquantes");
            }
          }
        } else {
          console.error("❌ Réponse invalide du serveur:", response.data);
          // En cas d'erreur dans la réponse
          const errorMessage = { 
            role: "bot", 
            content: response.data.error || "Désolé, une erreur s'est produite."
          };
          setMessages(prevMessages => [...prevMessages, errorMessage]);
        }
      })
      .catch((error) => {
        console.error("❌ Erreur lors de l'envoi du message :", error);
        console.error("Détails de l'erreur:", error.response?.data || error.message);
        
        // Supprimer le message temporaire
        setMessages(prevMessages => prevMessages.filter(msg => msg.content !== "..."));
        
        // Ajouter le message d'erreur
        const errorMessage = { 
          role: "bot", 
          content: "Désolé, une erreur s'est produite lors du traitement de votre message." 
        };
        setMessages(prevMessages => [...prevMessages, errorMessage]);
      });

    setInput("");
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
