const mongoose = require('mongoose');
require('dotenv').config({ path: './config/.env' });

const collectionsToKeep = [
  'users',
  'chatrooms',
  'conversations',
  'quizzes',
  'quizresults',
  'courses',
  'interestpoints',
  'videos',
  'modules',
  'categories',
  'markettrends'
];

async function cleanDatabase() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });
    console.log('✅ Connecté à MongoDB');

    // Obtenir toutes les collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    // Supprimer les collections qui ne sont pas dans la liste à garder
    for (const collection of collections) {
      if (!collectionsToKeep.includes(collection.name)) {
        console.log(`🗑️  Suppression de la collection: ${collection.name}`);
        await mongoose.connection.db.dropCollection(collection.name);
      } else {
        console.log(`✅ Conservation de la collection: ${collection.name}`);
      }
    }

    console.log('✨ Nettoyage de la base de données terminé');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

cleanDatabase(); 