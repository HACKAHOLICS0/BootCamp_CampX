import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import "./Chatbot.css";
import ChatbotLogo from "../../assets/img/img.jpg";

const Chatbot = () => {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

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
        setMessages(JSON.parse(savedMessages));
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
            if (response.data.success) {
              setMessages(response.data.data);
            }
          })
          .catch((error) => {
            console.error("❌ Erreur API :", error.response?.data || error);
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

  // Envoyer un message au chatbot
  const sendMessage = () => {
    if (!input.trim()) return;
    if (!user || !user.id) {
        console.warn("❌ Impossible d'envoyer un message : user.id est undefined");
        return;
    }

    const newMessage = { role: "user", content: input };
    setMessages([...messages, newMessage]);

    axios
        .post(
            "http://localhost:5000/api/chat/conversations", // ✅ Mise à jour de la conversation existante
            { userId: user.id, message: input },
            {
                headers: {
                    Authorization: `Bearer ${Cookies.get("token")}`,
                    "Content-Type": "application/json",
                },
            }
        )
        .then((response) => {
            if (response.data.success) {
                setMessages(response.data.data.messages); // ✅ Met à jour toute la conversation
            }
        })
        .catch((error) => {
            console.error("❌ Erreur lors de l'envoi du message :", error);
        });

    setInput("");
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
