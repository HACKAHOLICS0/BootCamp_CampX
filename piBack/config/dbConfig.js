const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./config/.env" });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/HACKAHOLICS", {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });

    console.log("✅ MongoDB connecté via Compass !");
    return conn;
  } catch (err) {
    console.error("❌ Erreur de connexion MongoDB :", err);
    // Retry connection after 5 seconds
    console.log("Tentative de reconnexion dans 5 secondes...");
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
