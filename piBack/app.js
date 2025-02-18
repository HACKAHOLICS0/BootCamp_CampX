const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const passport = require("passport");
require("./utils/passport"); // Configuration Passport
const bodyParser = require("body-parser");
const path = require("path");
const authRoutes = require("./routes/authRoutes");

// Charger les variables d'environnement
dotenv.config({ path: "./config/.env" });

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "uploads")));
app.use(passport.initialize());

// Votre connexion à la base (MongoDB) doit être initialisée ici
require("./config/dbConfig");

// Routes d'authentification
app.use("/api/auth", authRoutes);

// Gestion des routes non définies
app.all("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Démarrer le serveur
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
