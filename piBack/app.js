const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require('mongoose');
const path = require("path");
const bodyParser = require("body-parser");
const fs = require('fs');

const adminRoutes = require("./routes/AdminRoutes");
const authRoutes = require("./routes/authRoutes");
const interestPointRoutes = require('./routes/intrestRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const courseRoutes = require('./routes/courseRoutes');
const videoRoutes = require("./routes/videoRoutes");
const quizRoutes = require('./routes/quizRoutes');
const { initializePoints } = require('./controllers/intrestpoint');

dotenv.config({ path: "./config/.env" });
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
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
