const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');
const User = require('../Model/User');
const mongoose = require('mongoose');

// Configuration de la stratégie GitHub
passport.use(new GitHubStrategy(
  {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/api/auth/github/callback",
    scope: ['user:email'],
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Vérifie si un utilisateur existe déjà avec cet email
      let user = await User.findOne({ email: profile.emails?.[0]?.value });

      // Si l'utilisateur existe, on met à jour son GitHubId, sinon on en crée un nouveau
      if (user) {
        if (!user.githubId) {
          user.githubId = profile.id;
          await user.save(); // Mettre à jour l'ID GitHub
        }
      } else {
        // Crée un nouvel utilisateur si aucun n'est trouvé
        user = new User({
          githubId: profile.id,
          name: profile.displayName || profile.username,
          email: profile.emails?.[0]?.value || null,
          image: profile.photos?.[0]?.value || null,
          typeUser: 'user',
        });
        await user.save();

      }

      // Génération du JWT
      const token = jwt.sign(
        { id: user._id, githubId: user.githubId },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      return done(null, { user, token });
    } catch (error) {
      console.error('❌ GitHub Authentication Error:', error);
      return done(error, null);
    }
  }
));

// Sérialisation de l'utilisateur (stocker uniquement l'ID dans la session)
passport.serializeUser((data, done) => {
  const user = data.user;
  console.log("User being serialized:", user);

  if (!user || !user._id || !mongoose.Types.ObjectId.isValid(user._id)) {
    return done(new Error("Invalid user ID format"), null);
  }
  done(null, user._id);
});

// Désérialisation de l'utilisateur (retrouver l'utilisateur à partir de l'ID)
passport.deserializeUser(async (id, done) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return done(new Error("Invalid user ID format"), null);
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return done(new Error("User not found"), null);
    }
    done(null, user);
  } catch (error) {
    console.error('❌ Error during deserialization:', error);
    done(error, null);
  }
});
