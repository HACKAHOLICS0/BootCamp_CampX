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
const certificateRoutes = require('./routes/certificateRoutes');
const connectDB = require("./config/dbConfig");

require("dotenv").config({ path: "./config/.env" });

require("./utils/passport"); // Local auth
require("./utils/passport1") // Pass the app to githubAuth.js

const videoRoutes = require("./routes/VideoRoutes.js");

const bodyParser = require("body-parser");
const path = require("path");
const authRoutes = require("./routes/authRoutes");

const { initializePoints } = require("./controllers/intrestpoint");
const interestPointRoutes = require("./routes/intrestRoutes");

const questionRoutes = require('./routes/questionRoutes');
const paymentRoutes = require('./routes/paymentRoutes'); // Add payment routes

const app = express();
const server = http.createServer(app);

// Créer les dossiers nécessaires s'ils n'existent pas
const uploadsDir = path.join(__dirname, 'uploads');
const videosDir = path.join(uploadsDir, 'videos');
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Dossier uploads créé avec succès');
}
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
  console.log('Dossier uploads/videos créé avec succès');
}
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('Dossier public créé avec succès');
}

// Configuration CORS dynamique en fonction de l'environnement
const corsOrigin = process.env.NODE_ENV === 'production'
  ? process.env.CORS_ORIGIN || process.env.CLIENT_URL || 'https://campx-421bd90bea43.herokuapp.com'
  : "http://localhost:3000";

const io = new Server(server, {
  cors: {
    origin: corsOrigin, // Utiliser la même origine que pour l'application
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

console.log(`CORS Origin configuré sur: ${corsOrigin}`);

app.use(cors({
  origin: corsOrigin,
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

// Activer les requêtes préflight pour toutes les routes
app.options('*', cors());
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

// Middleware de journalisation pour déboguer les requêtes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Journaliser les en-têtes de la requête
  console.log('Headers:', JSON.stringify(req.headers));

  // Journaliser le corps de la requête pour les méthodes POST, PUT, PATCH
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    console.log('Body:', JSON.stringify(req.body));
  }

  // Capturer la réponse
  const originalSend = res.send;
  res.send = function(body) {
    console.log(`[${new Date().toISOString()}] Response status: ${res.statusCode}`);
    return originalSend.call(this, body);
  };

  next();
});


// Servir les fichiers statiques du dossier uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Servir les fichiers statiques du dossier public
app.use("/public", express.static(path.join(__dirname, "public")));

// Configuration pour servir les fichiers statiques avec CORS
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', corsOrigin); // Utiliser la même origine que pour l'application
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Cache-Control, Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Configuration CORS pour les fichiers statiques du dossier public
app.use('/public', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', corsOrigin); // Utiliser la même origine que pour l'application
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Cache-Control, Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
}, express.static(path.join(__dirname, 'public')));

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

// Configuration des routes de l'API
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);

// Configuration spéciale pour les routes de catégories avec CORS
app.use("/api/categories", cors({
  origin: corsOrigin,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "Cache-Control"],
  credentials: true,
}), categoryRoutes);
app.options('/api/categories/:id', cors());

// Configuration spéciale pour les routes de modules avec CORS
app.use("/api/modules", cors({
  origin: corsOrigin,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "Cache-Control"],
  credentials: true,
}), moduleRoutes);
app.options('/api/modules/:id', cors());

// Configuration spéciale pour les routes de quiz avec CORS
app.use("/api/quizzes", cors({
  origin: corsOrigin,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "Cache-Control"],
  credentials: true,
}), quizRoutes);
app.options('/api/quizzes/:id', cors());

app.use('/api/quiz', cors({
  origin: corsOrigin,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "Cache-Control"],
  credentials: true,
}), quizRoutes);
app.options('/api/quiz/:id', cors());
app.use("/api", interestPointRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/market-insights', marketInsightsRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', transcriptionRoutes);
app.use('/api/certificates', certificateRoutes);

// Configuration spéciale pour les routes de cours avec CORS
app.use("/api/courses", cors({
  origin: corsOrigin,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "Cache-Control"],
  credentials: true,
}), courseRoutes);
app.options('/api/courses/:id', cors());


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

    // En mode production, retourner une question par défaut
    const videoAnalysis = {
      content: "Contenu de la vidéo à analyser...",
      difficulty: 'intermediate',
      context: "Contexte de la section en cours"
    };

    // Créer une question par défaut
    const question = {
      question: "Quelle est la principale caractéristique de la programmation orientée objet?",
      options: [
        "L'encapsulation",
        "La récursivité",
        "La programmation fonctionnelle",
        "La programmation procédurale"
      ],
      correctAnswer: 0,
      type: "multiple-choice",
      explanation: "L'encapsulation est l'une des caractéristiques fondamentales de la programmation orientée objet, permettant de regrouper les données et les méthodes qui les manipulent."
    };

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


// Route de santé pour vérifier si le serveur est en cours d'exécution
app.get('/api/health', (req, res) => {
  console.log('Requête reçue sur /api/health');
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route de santé sans préfixe /api pour les tests directs
app.get('/health', (req, res) => {
  console.log('Requête reçue sur /health');
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route pour servir la page de test de connectivité
app.get('/test-connectivity', (req, res) => {
  console.log('Requête reçue sur /test-connectivity');
  res.sendFile(path.join(__dirname, 'public', 'test-connectivity.html'));
});

// Gestion des routes non définies
app.all("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});


