const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./Model/User');
require('dotenv').config({ path: './config/.env' });

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connecté à MongoDB');
    
    try {
      // Vérifier si un admin existe déjà
      const adminExists = await User.findOne({ typeUser: 'admin' });
      
      if (adminExists) {
        console.log('Un utilisateur admin existe déjà:');
        console.log(`Email: ${adminExists.email}`);
        console.log('Si vous avez oublié le mot de passe, vous pouvez le mettre à jour.');
      } else {
        // Créer un nouvel admin avec un mot de passe sécurisé
        const password = 'Admin123!';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newAdmin = new User({
          name: 'Admin',
          lastName: 'User',
          email: 'admin@campx.com',
          password: hashedPassword,
          typeUser: 'admin',
          isVerified: true,
          state: 1
        });
        
        await newAdmin.save();
        console.log('Utilisateur admin créé avec succès!');
        console.log('Email: admin@campx.com');
        console.log('Mot de passe: Admin123!');
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      // Fermer la connexion
      mongoose.connection.close();
    }
  })
  .catch(err => {
    console.error('Erreur de connexion à MongoDB:', err);
  });
