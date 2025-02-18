const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./config/.env" });

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connecté via Compass !"))
  .catch((err) => console.error("❌ Erreur de connexion MongoDB :", err));
