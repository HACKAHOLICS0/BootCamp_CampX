const express = require("express");
const cors = require("cors");
const passport = require("passport");
const mongoose = require("mongoose");
const session = require("express-session"); // Importation de express-session
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const interestPointModel = require("./Model/Interestpoint")
const adminRoutes = require("./routes/AdminRoutes"); 
const moduleRoutes = require("./routes/moduleRoutes");
const http = require("http");
const { Server } = require("socket.io");
const quizRoutes=require('./routes/quizRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const courseRoutes = require('./routes/courseRoutes');
const videoQuizRoutes = require('./routes/videoQuizRoutes');
const chatRoutes = require('./routes/chatRoutes'); // Importation des routes du chatbot
const ChatRoom = require("./Model/ChatRoom");

require("dotenv").config({ path: "./config/.env" }); // Load .env from config folder

require("./utils/passport"); // Local auth
require("./utils/passport1") // Pass the app to githubAuth.js


const videoRoutes = require("./routes/VideoRoutes");

const bodyParser = require("body-parser");
const path = require("path");
const authRoutes = require("./routes/authRoutes");

const { initializePoints } = require("./controllers/intrestpoint");
const interestPointRoutes = require("./routes/intrestRoutes");


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  }
});

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
// Attacher io à l'application pour qu'il soit accessible dans les routes
app.use(session({
  secret: process.env.SESSION_SECRET, // Vous pouvez mettre cette valeur dans votre fichier .env
  resave: false, 
  saveUninitialized: true, 
  cookie: { secure: false } // Mettre 'true' si vous utilisez HTTPS
}));

app.use(cookieParser());
app.use(passport.initialize());

app.use(express.json()); // Activer le parsing JSON


app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB Connection
require("./config/dbConfig");

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connexion à MongoDB réussie");
    initializePoints();
  })
  .catch((err) => {
    console.error("Erreur lors de la connexion à MongoDB:", err);
  });
  
// Routes d'authentification
app.use("/api/videos", videoRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", interestPointRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/videoquiz', videoQuizRoutes);
app.use('/api/chat', chatRoutes); // Ajout des routes du chatbot

// Socket.IO events
io.on('connection', (socket) => {
  console.log('Un utilisateur s\'est connecté');
  let currentUser = null;

  // Authentification du socket
  socket.on('authenticate', async (data) => {
    try {
      const { token, userId, displayName, avatar } = data;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      currentUser = { ...decoded, userId, displayName, avatar };
      socket.userId = userId;
      socket.displayName = displayName;
      socket.avatar = avatar || '';
      console.log(`Utilisateur ${displayName} (${userId}) authentifié avec avatar: ${avatar}`);
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
      socket.emit('auth_error', { message: 'Authentification échouée' });
    }
  });

  // Rejoindre une room
  socket.on('join_room', async (data) => {
    try {
      const { roomId, userId, displayName, avatar } = data;
      console.log('Join room data:', data);
      
      if (!roomId || !userId || !displayName) {
        console.error('Données manquantes:', data);
        return;
      }

      // Vérifier si la room existe, sinon la créer
      let chatRoom = await ChatRoom.findOne({ name: roomId });
      
      try {
        if (!chatRoom) {
          chatRoom = new ChatRoom({
            name: roomId,
            createdBy: userId
          });
          console.log('Nouvelle room créée:', roomId);
        }

        // Mettre à jour ou ajouter l'utilisateur avec son avatar
        const existingParticipant = chatRoom.participants.find(p => p.userId === userId);
        if (existingParticipant) {
          existingParticipant.username = displayName;
          existingParticipant.avatar = avatar || existingParticipant.avatar;
        } else {
          chatRoom.addParticipant(userId, displayName, avatar);
        }
        await chatRoom.save();

        socket.join(roomId);
        console.log(`Utilisateur ${displayName} (${userId}) a rejoint la room: ${roomId}`);

        // Récupérer tous les participants avec leurs avatars
        const participants = chatRoom.participants.map(p => ({
          userId: p.userId,
          displayName: p.username,
          avatar: p.avatar || ''
        }));

        // Envoyer la liste mise à jour des participants à tous les utilisateurs
        io.to(roomId).emit('users_in_room', participants);

        // Envoyer l'historique des messages avec les avatars
        const messagesWithAvatars = chatRoom.messages.map(msg => {
          const participant = chatRoom.participants.find(p => p.userId === msg.userId);
          return {
            ...msg.toObject(),
            avatar: msg.avatar || participant?.avatar || '',
            username: participant?.username || msg.username
          };
        });
        
        console.log('Sending message history with avatars:', messagesWithAvatars);
        socket.emit('message_history', messagesWithAvatars);

        // Informer les autres utilisateurs du nouvel arrivant
        socket.to(roomId).emit('user_joined', {
          userId,
          displayName,
          avatar: avatar || ''
        });
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de la room:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erreur lors de la jointure de la room:', error);
      socket.emit('room_error', { message: 'Erreur lors de la jointure de la room' });
    }
  });

  // Envoyer un message
  socket.on('send_message', async (data) => {
    try {
      const { roomId, userId, message, username, displayName, avatar } = data;
      console.log('Message reçu:', data);
      
      if (!userId || !roomId || !message) {
        console.error('Données manquantes:', data);
        return;
      }

      // Trouver la room et ajouter le message
      const chatRoom = await ChatRoom.findOne({ name: roomId });
      if (!chatRoom) {
        console.error('Room non trouvée:', roomId);
        return;
      }

      // S'assurer que l'utilisateur est un participant
      const participant = chatRoom.participants.find(p => p.userId === userId);
      if (!participant) {
        console.error('Utilisateur non trouvé dans la room:', userId);
        return;
      }

      // Utiliser l'avatar le plus récent
      const messageAvatar = avatar || participant.avatar || '';

      // Mettre à jour l'avatar du participant si nécessaire
      if (avatar && avatar !== participant.avatar) {
        participant.avatar = avatar;
        await chatRoom.save();
      }

      // Ajouter le message avec toutes les informations
      chatRoom.addMessage(userId, username || displayName || participant.username, message, messageAvatar);
      await chatRoom.save();

      // Récupérer le dernier message ajouté
      const newMessage = chatRoom.messages[chatRoom.messages.length - 1].toObject();
      
      // Préparer le message à envoyer avec toutes les informations
      const messageToSend = {
        ...newMessage,
        userId,
        username: username || displayName || participant.username,
        displayName: displayName || username || participant.username,
        avatar: messageAvatar
      };

      console.log('Message envoyé à la room:', roomId, messageToSend);

      // Émettre le message à tous les membres de la room
      io.to(roomId).emit('receive_message', messageToSend);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      socket.emit('message_error', { message: 'Erreur lors de l\'envoi du message' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Utilisateur ${socket.displayName || 'inconnu'} s'est déconnecté`);
  });
});

app.get('/api/points', async (req, res) => {
  try {
      const interestPointModel = require('./Model/Interestpoint'); 
      const points = await interestPointModel.find();
      res.status(200).json(points);
  } catch (err) {
      console.error("Erreur lors de la récupération des points d'intérêt:", err);
      res.status(500).json({ message: "Erreur serveur" });
  }
});




// Gestion des routes non définies
app.all("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start Server
const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
