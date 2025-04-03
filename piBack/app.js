const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require('mongoose');
const path = require("path");
const bodyParser = require("body-parser");
const fs = require('fs');
const axios = require('axios');

const adminRoutes = require("./routes/AdminRoutes");
const authRoutes = require("./routes/authRoutes");
const interestPointRoutes = require('./routes/intrestRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const courseRoutes = require('./routes/courseRoutes');
const videoRoutes = require("./routes/videoRoutes");
const quizRoutes = require('./routes/quizRoutes');
const { initializePoints } = require('./controllers/intrestpoint');
const videoAnalysisService = require('./services/videoAnalysisService');

dotenv.config({ path: "./config/.env" });
const app = express();

// Configuration de l'API Hugging Face
const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models";
const MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.2";

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Augmenter la limite de la taille du corps de la requête
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Configuration pour servir les fichiers statiques (vidéos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mp4')) {
      res.set({
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes'
      });
    }
  }
}));

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("Connexion à MongoDB réussie");
  initializePoints();
})
.catch((err) => {
  console.error("Erreur lors de la connexion à MongoDB:", err);
});

// API Routes
app.use("/api/videos", videoRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api', interestPointRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/courses', courseRoutes);

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

app.all("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
