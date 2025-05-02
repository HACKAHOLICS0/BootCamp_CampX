// utils/passport.js
const passport = require('passport');
const dotenv = require("dotenv");
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../config/.env') });

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../Model/User'); // Assurez-vous d'avoir un modèle User adapté
const jwt = require('jsonwebtoken');

// Vérifier que les variables d'environnement sont chargées
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Défini' : 'Non défini');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Défini' : 'Non défini');

// Utiliser des valeurs par défaut si les variables d'environnement ne sont pas définies
const googleClientId = process.env.GOOGLE_CLIENT_ID || '516793236433-a2qio8vquqcrkd3mrd6p57l7j7gfmc5a.apps.googleusercontent.com';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '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';

passport.use(
  new GoogleStrategy(
    {
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: "http://localhost:5002/api/auth/google/callback", // Mise à jour du port
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Vérifier uniquement par Google ID
        let user = await User.findOne({ googleId: profile.id });

        // Si l'utilisateur n'existe pas, en créer un nouveau même avec un email identique
        if (!user) {
          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails && profile.emails[0].value,
            image: profile.photos?.[0]?.value || null,
            authProvider: 'auth',
            typeUser: 'user',
          });
          await user.save();
        }



        return done(null, { user,  });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);


// (Optionnel) Pour la gestion des sessions, si vous les utilisez
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});