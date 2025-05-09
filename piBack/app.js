const express = require("express");
const cors = require("cors");
const passport = require("passport");
const mongoose = require("mongoose");
const session = require("express-session");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const interestPointModel = require("./Model/Interestpoint")
const adminRoutes = require("./routes/AdminRoutes");
const moduleRoutes = require("./routes/moduleRoutes");
const http = require("http");
const { Server } = require("socket.io");

const quizRoutes=require('./routes/quizRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const courseRoutes = require('./routes/courseRoutes');
const chatRoutes = require('./routes/chatRoutes');
const ChatRoom = require("./Model/ChatRoom");
const marketInsightsRoutes = require('./routes/marketInsights');
const transcriptionRoutes = require('./routes/transcriptionRoutes');
const connectDB = require("./config/dbConfig");
const eventRoutes = require('./routes/eventRoutes');
const youtubeRecommendationRoutes = require('./routes/youtubeRecommendationRoutes');
const certificateRoutes = require('./routes/certificateRoutes');

require("dotenv").config({ path: "./config/.env" });

require("./utils/passport"); // Local auth
require("./utils/passport1") // Pass the app to githubAuth.js

const videoRoutes = require("./routes/VideoRoutes");

const bodyParser = require("body-parser");
const path = require("path");
const authRoutes = require("./routes/authRoutes");

const { initializePoints } = require("./controllers/intrestpoint");
const interestPointRoutes = require("./routes/intrestRoutes");

const questionRoutes = require('./routes/questionRoutes');
const paymentRoutes = require('./routes/paymentRoutes'); // Add payment routes

const app = express();
const server = http.createServer(app);

// Liste des origines autorisées
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://www.ikramsegni.fr',
  'https://www.ikramsegni.fr',
  'http://ikramsegni.fr',
  'https://ikramsegni.fr',
  'http://51.91.251.228',
  'https://51.91.251.228'
];

// Configuration de Socket.IO avec CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Cache-Control"
    ],
    exposedHeaders: ["Content-Range", "X-Content-Range"]
  },
  path: '/socket.io/'
});

// Configuration CORS pour Express
const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origin (comme Postman ou curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Origin non autorisée:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "Cache-Control"],
  credentials: true,
  optionsSuccessStatus: 200
};

// Appliquer CORS globalement
app.use(cors(corsOptions));

// Configuration de l'API Hugging Face
const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models";
const MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.2";

// Configuration de la session
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_key_for_session',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Mettre 'true' si vous utilisez HTTPS
}));

app.use(cookieParser());
app.use(passport.initialize());

app.use(express.json()); // Activer le parsing JSON
app.use(express.urlencoded({ extended: true }));

// Vérifier si les dossiers pour les fichiers statiques existent
const uploadsDir = path.join(__dirname, "uploads");
const publicDir = path.join(__dirname, "public");
const qrCodesDir = path.join(__dirname, "public/qrcodes");
const icsDir = path.join(__dirname, "public/ics");

// Créer les dossiers s'ils n'existent pas
if (!fs.existsSync(uploadsDir)) {
  console.log('Création du dossier uploads...');
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(publicDir)) {
  console.log('Création du dossier public...');
  fs.mkdirSync(publicDir, { recursive: true });
}

if (!fs.existsSync(qrCodesDir)) {
  console.log('Création du dossier public/qrcodes...');
  fs.mkdirSync(qrCodesDir, { recursive: true });
}

if (!fs.existsSync(icsDir)) {
  console.log('Création du dossier public/ics...');
  fs.mkdirSync(icsDir, { recursive: true });
}

// Configuration pour servir les fichiers statiques
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/public", express.static(path.join(__dirname, "public")));

// Afficher les chemins des dossiers statiques pour le débogage
console.log('Dossier uploads:', uploadsDir);
console.log('Dossier public:', publicDir);
console.log('Dossier QR codes:', qrCodesDir);
console.log('Dossier ICS:', icsDir);

// Configuration pour servir les fichiers statiques avec CORS
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Cache-Control, Content-Type');
  next();
}, express.static(path.join(__dirname, 'uploads')));

app.use('/public', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Cache-Control, Content-Type');
  next();
}, express.static(path.join(__dirname, 'public')));

// Connexion MongoDB et démarrage du serveur
const startServer = async () => {
  try {
    await connectDB();
    console.log("Connexion à MongoDB réussie");
    
    // Corriger les chemins d'image
    try {
      const { fixImagePaths } = require('./utils/imagePathFixer');
      await fixImagePaths();
      console.log("Vérification des chemins d'image terminée");
    } catch (error) {
      console.error("Erreur lors de la correction des chemins d'image:", error);
    }
    
    initializePoints();

    // Start Server
    const port = process.env.PORT || 5000;
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Erreur lors du démarrage du serveur:", err);
  }
};

startServer();

// Routes d'authentification
app.use("/api/videos", videoRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/modules", moduleRoutes);

// Routes API
app.use("/api/quizzes", quizRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api", interestPointRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/market-insights', marketInsightsRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', transcriptionRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/certificates', certificateRoutes);

// Routes pour le moteur de recommandation
const recommendationRoutes = require('./routes/recommendationRoutes');
app.use('/api/recommendations', recommendationRoutes);

// Routes pour les recommandations YouTube
app.use('/api/youtube', youtubeRecommendationRoutes);

// Routes pour le proxy vidéo
const videoProxyRoutes = require('./routes/videoProxy');
app.use('/api/video-proxy', videoProxyRoutes);

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

// Route pour récupérer les informations de l'utilisateur connecté
const { authMiddleware } = require('./middleware/authMiddleware');
const User = require('./Model/User');
app.get('/api/users/me', authMiddleware, async (req, res) => {
  try {
    // L'utilisateur est déjà disponible dans req.user grâce au middleware d'authentification
    const user = req.user;

    console.log("Récupération des informations utilisateur pour:", user._id);

    // Récupérer l'utilisateur avec les cours achetés
    const userWithCourses = await User.findById(user._id)
      .populate('enrolledCourses.courseId', 'title description');

    if (!userWithCourses) {
      console.log("Utilisateur non trouvé dans la base de données");
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier et formater les données des cours achetés
    if (userWithCourses.enrolledCourses && Array.isArray(userWithCourses.enrolledCourses)) {
      console.log("Nombre de cours achetés:", userWithCourses.enrolledCourses.length);

      // Afficher les détails des cours achetés pour le débogage
      userWithCourses.enrolledCourses.forEach((course, index) => {
        console.log(`Cours ${index + 1}:`, course);
        if (course.courseId) {
          if (typeof course.courseId === 'object') {
            console.log(`- ID: ${course.courseId._id}`);
            console.log(`- Titre: ${course.courseId.title}`);
          } else {
            console.log(`- ID: ${course.courseId}`);
          }
        } else {
          console.log("- Cours sans ID valide");
        }
      });
    } else {
      console.log("Aucun cours acheté trouvé ou format inattendu");
    }

    // Retourner les informations de l'utilisateur
    res.status(200).json(userWithCourses);
  } catch (error) {
    console.error('Erreur lors de la récupération des informations utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour la page d'accueil
app.get('/', (req, res) => {
  res.send('API is running');
});

// Route pour vérifier l'état du serveur
app.get('/api/status', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Gestion des routes non définies
app.all("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = app;