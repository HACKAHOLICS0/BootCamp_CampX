import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Cookies from 'js-cookie';
import './ChatRoom.css';

const SOCKET_SERVER_URL = 'http://localhost:5000';

const ChatRoom = ({ roomId, username }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [displayName, setDisplayName] = useState('');

  // Connexion au socket avec authentification
  useEffect(() => {
    const token = Cookies.get('token');
    const user = Cookies.get('user') ? JSON.parse(Cookies.get('user')) : null;
    
    if (!token || !user) {
      console.error('Non authentifié');
      return;
    }

    // Construire le nom d'affichage
    const userDisplayName = user.lastName ? `${user.name} ${user.lastName}` : user.name;
    setDisplayName(userDisplayName);

    console.log('Utilisateur actuel:', user);

    const newSocket = io(SOCKET_SERVER_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Connecté au serveur Socket.IO');
      setIsConnected(true);
      
      // Authentifier le socket avec l'ID utilisateur et le nom d'affichage
      newSocket.emit('authenticate', { 
        token,
        userId: user.id,
        displayName: userDisplayName
      });
      
      // Rejoindre la room avec l'ID utilisateur
      newSocket.emit('join_room', { 
        roomId, 
        userId: user.id,
        displayName: userDisplayName
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('Erreur de connexion:', error.message);
      setIsConnected(false);
    });

    // Écouter l'historique des messages
    newSocket.on('message_history', (history) => {
      console.log('Historique reçu:', history);
      setMessages(history);
    });

    // Écouter les nouveaux messages
    newSocket.on('receive_message', (message) => {
      console.log('Message reçu:', message);
      setMessages(prevMessages => [...prevMessages, message]);
    });

    setSocket(newSocket);

    // Cleanup function
    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [roomId]);

  // Auto-scroll vers le dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket && isConnected) {
      const user = JSON.parse(Cookies.get('user'));
      
      socket.emit('send_message', {
        roomId,
        userId: user.id,
        message: newMessage,
        time: new Date().toISOString()
      });

      setNewMessage('');
    }
  };

  const isOwnMessage = (msg) => {
    const user = JSON.parse(Cookies.get('user'));
    return msg.userId === user.id; // Utiliser user.id au lieu de user._id
  };

  return (
    <div className="chat-room">
      <div className="chat-header">
        <h2>Chat Room: {roomId}</h2>
        <div className="connection-status">
          {isConnected ? (
            <span className="status-connected">Connecté en tant que {displayName}</span>
          ) : (
            <span className="status-disconnected">Déconnecté</span>
          )}
        </div>
      </div>
      
      <div className="messages-container">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${isOwnMessage(msg) ? 'sent' : 'received'}`}
          >
            <div className="message-content">
              <p>{msg.message}</p>
              <div className="message-info">
                <span className="author">{msg.displayName || msg.username}</span>
                <span className="time">
                  {new Date(msg.time).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Tapez votre message..."
          className="message-input"
        />
        <button type="submit" className="send-button" disabled={!isConnected}>
          Envoyer
        </button>
      </form>
    </div>
  );
};

export default ChatRoom; 