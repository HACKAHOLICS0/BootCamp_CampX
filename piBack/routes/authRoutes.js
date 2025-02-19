const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); // <-- Import de jsonwebtoken
const authController = require('../controllers/authController');
const upload = require('../config/multerConfig'); // Middleware pour gérer l'upload d'images
const passport = require("passport");

// Vérification de l'email
router.get('/check/:email', authController.checkEmailExists);

// Inscription (avec upload d'image)
router.post('/signup', upload.single('image'), authController.signup);

// Connexion
router.post('/signin', authController.signin);

// Envoi de code de vérification
router.post('/send-code', authController.sendVerificationCode);

// Vérification du code
router.post('/verify-code', authController.verifyCode);

// Réinitialisation du mot de passe
router.post('/reset-password', authController.resetPassword);

// Pour l'email de réinitialisation
router.post('/forgotpasswordemail', authController.forgotPasswordEmail);
router.post('/resetpasswordemail', authController.resetPasswordEmail);

// Route pour lancer l'authentification Google
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback après authentification Google
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/signin' }),
  (req, res) => {
    // À ce stade, req.user contient l'utilisateur authentifié
    // On génère un token JWT
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // Redirection vers le frontend en incluant le token dans l'URL
    res.redirect(`http://localhost:3000/google/${token}`);
  }
);
router.put("/:id", upload.single('image'), authController.editUser);
router.get("/:id", authController.getUserById);


module.exports = router;
