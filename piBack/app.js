require("dotenv").config({ path: "./config/.env" }); // Load .env from config folder
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const mongoose = require("mongoose");
const session = require("express-session"); // Importation de express-session
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');




require("./utils/passport"); // Local auth
require("./utils/passport1") // Pass the app to githubAuth.js

const bodyParser = require("body-parser");
const path = require("path");
const authRoutes = require("./routes/authRoutes");

const { initializePoints } = require("./controllers/intrestpoint");
const interestPointRoutes = require("./routes/intrestRoutes");


const app = express();
app.use(session({
  secret: process.env.SESSION_SECRET, // Vous pouvez mettre cette valeur dans votre fichier .env
  resave: false, 
  saveUninitialized: true, 
  cookie: { secure: false } // Mettre 'true' si vous utilisez HTTPS
}));


app.use(cookieParser());
app.use(passport.initialize());

app.use(cors());
app.use(bodyParser.json());
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
app.use("/api/auth", authRoutes);
app.use("/api", interestPointRoutes);

app.get("/api/points", async (req, res) => {
  try {
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
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
