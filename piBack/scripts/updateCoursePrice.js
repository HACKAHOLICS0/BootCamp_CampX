const mongoose = require('mongoose');
require('dotenv').config();

// Récupérer le modèle Course
const Course = require('../Model/Course');

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connecté à MongoDB'))
  .catch(err => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
  });

// Mettre à jour le prix du cours HTML/CSS à 5 dinars
const updateCoursePrices = async () => {
  try {
    // Trouver le cours HTML/CSS par son titre
    const course = await Course.findOne({ title: "HTML et CSS" });
    
    if (!course) {
      console.log('Cours "HTML et CSS" non trouvé.');
      process.exit(0);
    }
    
    // Mettre à jour le prix
    course.price = 5;
    await course.save();
    
    console.log(`Prix du cours "${course.title}" mis à jour à 5 TND.`);
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la mise à jour des prix:', error);
    process.exit(1);
  }
};

// Exécuter la fonction de mise à jour
updateCoursePrices();
