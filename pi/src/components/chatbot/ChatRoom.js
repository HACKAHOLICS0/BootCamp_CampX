import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Cookies from 'js-cookie';
import './ChatRoom.css';
import ChatbotLogo from "../../assets/img/img.jpg";
import axios from 'axios';

const SOCKET_SERVER_URL = 'http://localhost:5000';
const DEFAULT_AVATAR = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

const ChatRoom = ({ roomId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [usersInRoom, setUsersInRoom] = useState(new Map());

  // Fonction pour récupérer l'avatar d'un utilisateur
  const fetchUserAvatar = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${Cookies.get('token')}`
        }
      });
      if (response.data && response.data.data) {
        const userInfo = response.data.data;
        return userInfo.profileImage || userInfo.avatar || userInfo.image || DEFAULT_AVATAR;
      }
      return DEFAULT_AVATAR;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'avatar:', error);
      return DEFAULT_AVATAR;
    }
  };

  useEffect(() => {
    const token = Cookies.get('token');
    const userCookie = Cookies.get('user');
    
    if (!token || !userCookie) {
      console.error('Non authentifié');
      return;
    }

    let user;
    try {
      user = JSON.parse(decodeURIComponent(userCookie));
      console.log('User data from cookie:', user);
    } catch (error) {
      console.error('Erreur de parsing du cookie user:', error);
      return;
    }

    const userDisplayName = user.lastName ? `${user.name} ${user.lastName}` : user.name;
    setDisplayName(userDisplayName);
    
    const userAvatarUrl = user.profileImage || user.avatar || user.image || DEFAULT_AVATAR;
    console.log('Avatar URL:', userAvatarUrl);
    setUserAvatar(userAvatarUrl);

    const newSocket = io(SOCKET_SERVER_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Connecté au serveur Socket.IO');
      setIsConnected(true);
      
      newSocket.emit('authenticate', { 
        token,
        userId: user.id,
        displayName: userDisplayName,
        avatar: userAvatarUrl
      });
      
      newSocket.emit('join_room', { 
        roomId, 
        userId: user.id,
        displayName: userDisplayName,
        avatar: userAvatarUrl
      });
    });

    // Écouter les utilisateurs dans la room
    newSocket.on('users_in_room', (users) => {
      console.log('Users in room:', users);
      const usersMap = new Map();
      users.forEach(user => {
        if (user.userId && (user.avatar || user.displayName)) {
          usersMap.set(user.userId, {
            displayName: user.displayName,
            avatar: user.avatar || DEFAULT_AVATAR
          });
          console.log(`Setting avatar for user ${user.userId}:`, user.avatar || DEFAULT_AVATAR);
        }
      });
      setUsersInRoom(usersMap);
    });

    // Écouter les nouveaux utilisateurs
    newSocket.on('user_joined', (user) => {
      console.log('User joined:', user);
      setUsersInRoom(prev => {
        const newMap = new Map(prev);
        newMap.set(user.userId, {
          displayName: user.displayName,
          avatar: user.avatar || DEFAULT_AVATAR
        });
        return newMap;
      });
    });

    // Écouter l'historique des messages
    newSocket.on('message_history', (history) => {
      console.log('Message history:', history);
      const processedMessages = history.map(msg => ({
        ...msg,
        avatar: msg.avatar || usersInRoom.get(msg.userId)?.avatar || DEFAULT_AVATAR
      }));
      setMessages(processedMessages);
    });

    // Écouter les nouveaux messages
    newSocket.on('receive_message', (message) => {
      console.log('Message received:', message);
      let messageAvatar = message.avatar;
      
      // Si pas d'avatar dans le message, chercher dans usersInRoom
      if (!messageAvatar) {
        const userInfo = usersInRoom.get(message.userId);
        messageAvatar = userInfo?.avatar || DEFAULT_AVATAR;
        console.log(`Using avatar from usersInRoom for ${message.userId}:`, messageAvatar);
      }
      
      setMessages(prevMessages => [...prevMessages, {
        ...message,
        avatar: messageAvatar
      }]);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Erreur de connexion:', error.message);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket && isConnected) {
      const user = JSON.parse(decodeURIComponent(Cookies.get('user')));
      
      const messageData = {
        roomId,
        userId: user.id,
        message: newMessage,
        username: displayName,
        displayName: displayName,
        avatar: userAvatar,
        time: new Date().toISOString()
      };

      console.log('Sending message:', messageData);
      socket.emit('send_message', messageData);

      setNewMessage('');
    }
  };

  const isOwnMessage = (msg) => {
    try {
      const user = JSON.parse(decodeURIComponent(Cookies.get('user')));
      return msg.userId === user.id;
    } catch (error) {
      console.error('Error parsing user cookie:', error);
      return false;
    }
  };

  return (
    <div className="chat-room">
      <div className="chat-header">
        <h2>
          <img src={ChatbotLogo} alt="App Logo" className="app-logo" />
          CAMP X Chat
        </h2>
        <div className="connection-status">
          {isConnected ? (
            <span className="status-connected">
              <img 
                src={userAvatar} 
                alt="Your avatar" 
                className="header-avatar"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_AVATAR;
                }}
              />
              Connecté en tant que {displayName}
            </span>
          ) : (
            <span className="status-disconnected">Déconnecté</span>
          )}
        </div>
      </div>
      
      <div className="messages-container">
        {messages.map((msg, index) => {
          const isOwn = isOwnMessage(msg);
          let messageAvatar;
          
          if (isOwn) {
            messageAvatar = userAvatar;
          } else {
            // Pour les messages des autres utilisateurs
            messageAvatar = msg.avatar || usersInRoom.get(msg.userId)?.avatar || DEFAULT_AVATAR;
          }
          
          console.log(`Message ${index} avatar (${isOwn ? 'own' : 'other'}):`, messageAvatar);
          
          return (
            <div
              key={index}
              className={`message ${isOwn ? 'sent' : 'received'}`}
            >
              <img 
                src={messageAvatar}
                alt="avatar" 
                className="message-avatar"
                onError={(e) => {
                  console.log('Avatar load error, using default:', e.target.src);
                  e.target.onerror = null;
                  e.target.src = DEFAULT_AVATAR;
                }}
              />
              <div className="message-content">
                <p>{msg.message}</p>
                <div className="message-info">
                  <span className="author">{isOwn ? displayName : (msg.username || msg.displayName)}</span>
                  <span className="time">
                    {new Date(msg.time).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
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