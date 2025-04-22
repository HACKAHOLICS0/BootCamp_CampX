const express = require("express");
const cors = require("cors");
const passport = require("passport");
const mongoose = require("mongoose");
const session = require("express-session"); // Importation de express-session
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const fs = require('fs'); // Add fs module import
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

require("dotenv").config({ path: "./config/.env" });

require("./utils/passport"); // Local auth
require("./utils/passport1") // Pass the app to githubAuth.js

const videoRoutes = require("./routes/videoRoutes");

const bodyParser = require("body-parser");
const path = require("path");
const authRoutes = require("./routes/authRoutes");

const { initializePoints } = require("./controllers/intrestpoint");
const interestPointRoutes = require("./routes/intrestRoutes");

const questionRoutes = require('./routes/questionRoutes');
const paymentRoutes = require('./routes/paymentRoutes'); // Add payment routes

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
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
    exposedHeaders: ["Content-Range", "X-Content-Range"]  }
});

// Configuration de l'API Hugging Face
const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models";
const MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.2";
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Cache-Control"
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"]
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
app.use(express.urlencoded({ extended: true }));


app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Configuration pour servir les fichiers statiques avec CORS
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Cache-Control, Content-Type');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Connexion MongoDB
const startServer = async () => {
  try {
    await connectDB();
    console.log("Connexion à MongoDB réussie");
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
app.use("/api/courses",cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "Cache-Control"],
  credentials: true,
}), courseRoutes);
app.options('/api/courses/:id', cors());

app.use("/api/quizzes", quizRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api", interestPointRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/chat', chatRoutes); // Ajout des routes du chatbot
app.use('/api/market-insights', marketInsightsRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/payments', paymentRoutes); // Mount payment routes
app.use('/api', transcriptionRoutes); // Routes pour la transcription audio


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



// Route pour générer des questions
app.post('/api/generate-question', async (req, res) => {
  try {
    const { timestamp, videoUrl, section } = req.body;
    console.log('Génération de question pour:', { timestamp, videoUrl, section });

    if (!timestamp || !videoUrl) {
      return res.status(400).json({ error: 'timestamp et videoUrl sont requis' });
    }

    // Extraire le sujet de la vidéo de l'URL et du chemin
    const videoPath = videoUrl.toLowerCase();
    let videoSubject = 'programmation';

    // Détection automatique du sujet basée sur le chemin de la vidéo
    if (videoPath.includes('html') || videoPath.includes('web')) {
      videoSubject = 'développement web';
    } else if (videoPath.includes('machine') || videoPath.includes('ml') || videoPath.includes('ai')) {
      videoSubject = 'machine learning';
    } else if (videoPath.includes('python')) {
      videoSubject = 'Python';
    } else if (videoPath.includes('javascript') || videoPath.includes('js')) {
      videoSubject = 'JavaScript';
    } else if (videoPath.includes('java')) {
      videoSubject = 'Java';
    } else if (videoPath.includes('c++') || videoPath.includes('cpp')) {
      videoSubject = 'C++';
    }

    // Analyser le contenu de la vidéo autour du timestamp
    let videoAnalysis;
    try {
      videoAnalysis = await videoAnalysisService.analyzeVideoContent(videoUrl, timestamp);
    } catch (error) {
      console.error('Erreur lors de l\'analyse du contenu vidéo:', error);
      // En cas d'erreur d'analyse, utiliser un contenu par défaut
      videoAnalysis = {
        content: "Contenu de la vidéo à analyser...",
        difficulty: 'intermediate',
        context: "Contexte de la section en cours"
      };
    }

    // Générer une question basée sur le contenu analysé
    const question = await videoAnalysisService.createQuestionFromText(videoAnalysis.content);

    if (!question) {
      return res.status(500).json({
        error: 'Impossible de générer une question valide',
        details: 'Le contenu de la vidéo ne permet pas de générer une question pertinente'
      });
    }

    // Ajouter des métadonnées à la question
    question.metadata = {
      timestamp,
      subject: videoSubject,
      difficulty: videoAnalysis.difficulty,
      context: videoAnalysis.context,
      section: section ? {
        startTime: section.startTime,
        endTime: section.endTime
      } : null
    };

    res.json({
      question: {
        text: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        type: question.type,
        timestamp: timestamp,
        subject: videoSubject,
        explanation: question.explanation,
        metadata: question.metadata
      }
    });
  } catch (error) {
    console.error('Erreur lors de la génération de la question:', error);
    res.status(500).json({
      error: 'Erreur lors de la génération de la question',
      details: error.message
    });
  }
});

// Route pour tester si une vidéo existe
app.get('/check-video/:filename', (req, res) => {
  const videoPath = path.join(path.join(__dirname, 'uploads'), 'videos', req.params.filename);
  if (fs.existsSync(videoPath)) {
    res.json({ exists: true });
  } else {
    res.json({ exists: false });
  }
});

// Route de test pour les vidéos
app.get('/test-video', (req, res) => {
  res.send(`
    <html>
      <body>
        <h2>Test de lecture vidéo</h2>
        <video width="640" height="360" controls>
          <source src="/uploads/videos/test.mp4" type="video/mp4">
          Votre navigateur ne supporte pas la lecture de vidéos.
        </video>
      </body>
    </html>
  `);
});


// Gestion des routes non définies
app.all("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});
