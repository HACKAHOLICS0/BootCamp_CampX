const mongoose = require('mongoose');
const Event = require('../Model/Event');
const path = require('path');

// Connexion à MongoDB
const connectDB = async () => {
  try {
    // Utiliser directement l'URL de connexion MongoDB
    const MONGO_URI = 'mongodb://127.0.0.1:27017/HACKAHOLICS';
    await mongoose.connect(MONGO_URI);
    console.log('Connexion à MongoDB réussie');
  } catch (err) {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
  }
};

// Fonction pour lister les événements
const listEvents = async () => {
  try {
    await connectDB();
    
    // Compter le nombre total d'événements
    const count = await Event.countDocuments();
    console.log(`Nombre total d'événements dans la base de données: ${count}`);
    
    // Récupérer les 10 premiers événements pour affichage
    const events = await Event.find().limit(10);
    
    console.log('\nListe des 10 premiers événements:');
    events.forEach((event, index) => {
      console.log(`\n${index + 1}. ${event.title}`);
      console.log(`   Catégorie: ${event.category}`);
      console.log(`   Lieu: ${event.location}`);
      console.log(`   Date: ${event.date.toLocaleDateString()}`);
      console.log(`   Approuvé: ${event.isApproved ? 'Oui' : 'Non'}`);
    });
    
    // Statistiques par catégorie
    const categories = await Event.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\nStatistiques par catégorie:');
    categories.forEach(cat => {
      console.log(`- ${cat._id}: ${cat.count} événements`);
    });
    
    mongoose.connection.close();
    console.log('\nConnexion à MongoDB fermée');
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error);
    mongoose.connection.close();
  }
};

// Exécuter la fonction
listEvents();
