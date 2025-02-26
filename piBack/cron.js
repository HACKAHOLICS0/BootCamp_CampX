const cron = require("node-cron");
const mongoose = require("mongoose");
const User = require("./Model/User");
require("dotenv").config({ path: "./config/.env" }); // Charger les variables d'environnement

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));

// Tâche CRON : Supprimer les utilisateurs non vérifiés créés aujourd'hui à minuit
cron.schedule("0 0 * * *", async () => {
    console.log("🕛 CRON JOB: Suppression des utilisateurs non vérifiés créés aujourd'hui...");

    // Récupérer la date d'aujourd'hui à minuit (00:00:00)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Récupérer la date de demain à minuit (23:59:59)
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    try {
        const result = await User.deleteMany({
            isVerified: false,
        });

        console.log(`✅ ${result.deletedCount} utilisateurs non vérifiés supprimés.`);
    } catch (error) {
        console.error("❌ Erreur lors de la suppression:", error);
    }
});

console.log("✅ CRON job planifié pour minuit.");