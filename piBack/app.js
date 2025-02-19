const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const passport = require("passport");
const mongoose = require('mongoose');

require("./utils/passport"); // Configuration Passport
const bodyParser = require("body-parser");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const { initializePoints } = require('./controllers/intrestpoint'); // Ton contrôleur pour les points d'intérêt
const interestPointRoutes = require('./routes/intrestRoutes'); // Assurez-vous que le chemin est correct
// Charger les variables d'environnement
dotenv.config({ path: "./config/.env" });

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(passport.initialize());

// Votre connexion à la base (MongoDB) doit être initialisée ici
require("./config/dbConfig");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("Connexion à MongoDB réussie");

  // Appeler la fonction d'initialisation des points d'intérêt
  initializePoints(); // Insérer les points d'intérêt par défaut dans la base de données
})
.catch((err) => {
  console.error("Erreur lors de la connexion à MongoDB:", err);
});

// Routes d'authentification
app.use("/api/auth", authRoutes);

const interestPointModel = require('./Model/Interestpoint'); // Assure-toi d'importer ton modèle
app.use('/api', interestPointRoutes);
app.get('/api/points', async (req, res) => {
    try {
        const points = await interestPointModel.find();
        res.status(200).json(points); // Retourne les points d'intérêt au client
    } catch (err) {
        console.error("Erreur lors de la récupération des points d'intérêt:", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});
// Gestion des routes non définies
app.all("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Démarrer le serveur
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
