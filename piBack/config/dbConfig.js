const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Charger les variables d'environnement
dotenv.config({ path: "./config/.env" });

const connectDB = async () => {
  try {
    // Utiliser MONGODB_URI en priorité, puis MONGO_URI, puis une valeur par défaut
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI ;

    console.log(`Tentative de connexion à MongoDB avec l'URI: ${mongoURI.substring(0, 20)}...`);

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
      retryWrites: true,
      w: "majority"
    });

    console.log("✅ MongoDB connecté avec succès !");
    console.log(`Base de données: ${conn.connection.name}`);
    console.log(`Hôte: ${conn.connection.host}`);

    // Vérifier la connexion en exécutant une requête simple
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`Collections disponibles: ${collections.length}`);

    return conn;
  } catch (err) {
    console.error("❌ Erreur de connexion MongoDB :", err);

    // Afficher plus de détails sur l'erreur
    if (err.name === 'MongoServerSelectionError') {
      console.error("Impossible de se connecter au serveur MongoDB. Vérifiez l'URI et les paramètres de connexion.");
    } else if (err.name === 'MongoParseError') {
      console.error("URI MongoDB invalide. Vérifiez le format de l'URI.");
    }

    // Retry connection after 5 seconds
    console.log("Tentative de reconnexion dans 5 secondes...");
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
