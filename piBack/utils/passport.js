// utils/passport.js
const passport = require('passport');
const dotenv = require("dotenv");
const User = require('../Model/User'); // Assurez-vous d'avoir un modèle User adapté
const jwt = require('jsonwebtoken');
dotenv.config({ path: "./config/.env" });

// Vérifier si les identifiants Google OAuth sont disponibles
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;

  // Configurer la stratégie Google OAuth uniquement si les identifiants sont disponibles
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.NODE_ENV === 'production'
          ? `${process.env.CLIENT_URL}/api/auth/google/callback`
          : "http://localhost:5000/api/auth/google/callback",
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
              authProvider: 'google',
              typeUser: 'user',
              isVerified: true // Les utilisateurs Google sont automatiquement vérifiés
            });
            await user.save();
          }

          return done(null, { user });
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
  console.log('Google OAuth credentials not found. Google authentication is disabled.');
}


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
