// utils/passport.js
const passport = require('passport');
const dotenv = require("dotenv");

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../Model/User'); // Assurez-vous d'avoir un modèle User adapté
const jwt = require('jsonwebtoken');
dotenv.config({ path: "./config/.env" });

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/auth/google/callback",
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
