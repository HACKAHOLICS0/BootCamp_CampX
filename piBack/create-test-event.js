const mongoose = require('mongoose');
const Event = require('./Model/Event');
require('dotenv').config({ path: './config/.env' });

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connecté à MongoDB');
    
    try {
      // Créer un événement de test
      const testEvent = new Event({
        title: 'Événement de test en attente',
        description: 'Cet événement est créé pour tester la fonctionnalité d\'approbation.',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans une semaine
        location: 'Esprit',
        organizer: '67b21a98d16205f25de83b08', // ID de l'utilisateur khalil.benyahiawenich@esprit.tn
        maxAttendees: 10,
        category: 'workshop',
        status: 'upcoming',
        isApproved: false, // En attente d'approbation
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await testEvent.save();
      console.log('Événement de test créé avec succès!');
      console.log('ID de l\'événement:', testEvent._id);
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement de test:', error);
    } finally {
      // Fermer la connexion
      mongoose.connection.close();
    }
  })
  .catch(err => {
    console.error('Erreur de connexion à MongoDB:', err);
  });
