const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const twilio = require('twilio');
const User = require('../Model/User');
const axios = require("axios");
require('dotenv').config();
const sendEmail = require('../utils/email');
// Check if an email exists
const checkEmailExists = async (req, res) => {
  const { email } = req.params;
  try {
    const existingUser = await User.findOne({ email });
    return res.status(200).json({ exists: !!existingUser });
  } catch (error) {
    console.error('Error during email check:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const signup = async (req, res) => {
  const { name, lastName, birthDate, phone, email, password } = req.body; // 'lastName' ici
  const imagePath = req.file ? req.file.path : null; // Récupère le chemin de l'image téléchargée

  // Validation des champs nécessaires
  if (!name || !lastName || !birthDate || !phone || !email || !password) {  // 'lastName' ici
      return res.status(400).json({ error: 'All fields are required' });
  }

  try {
      // Vérifie si l'utilisateur existe déjà
      const existingUser = await User.findOne({ email });
      if (existingUser) {
          return res.status(400).json({ error: 'Email already exists' });
      }

      // Hacher le mot de passe avant de le sauvegarder
      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Créer un nouvel utilisateur
      const newUser = new User({
          name,
          lastName, // 'lastName' ici
          birthDate,
          phone,
          email,
          typeUser: "user", // Ajouter le type d'utilisateur
          password: hashedPassword, // Mot de passe haché
          image: imagePath, // Ajouter l'image
          emailVerificationToken: verificationToken, // ✅ Stocke le token

      });

      await newUser.save();
          // Envoyer l'email de vérification
          const verificationLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
          const emailSubject = 'Verify Your Email';
          const emailBody = `
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        .container { padding: 20px; }
                        .button {
                            background-color: #007bff;
                            color: white;
                            padding: 10px 15px;
                            text-decoration: none;
                            display: inline-block;
                            border-radius: 5px;
                            margin-top: 10px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <p>Hello ${newUser.name},</p>
                        <p>Thank you for registering. Please click the button below to verify your email address:</p>
                        <p><a href="${verificationLink}" class="button">Verify Email</a></p>
                        <p>If you did not request this, please ignore this email.</p>
                        <p>Best regards,</p>
                        <p>Your Team</p>
                    </div>
                </body>
                </html>
            `;
          await sendEmail(newUser.email, emailSubject, emailBody);
    
          res.status(201).json({ message: 'User registered successfully. Please check your email to verify your account.' });
  } catch (error) {
      console.error('Error during signup:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.params;
  console.log("Received token:", token); // ✅ Affiche le token reçu

  try {
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded token:", decoded); // ✅ Affiche les infos du token

      // Trouver l'utilisateur avec ce token et cet email
      const user = await User.findOne({ email: decoded.email, emailVerificationToken: token });
      console.log("Found user:", user); // ✅ Affiche l'utilisateur trouvé ou null

      if (!user) {
          return res.status(400).json({ message: 'Invalid or expired token' });
      }

      // Mettre à jour l'utilisateur comme vérifié
      user.isVerified = true;
      user.emailVerificationToken = null; // ✅ Supprime le token après vérification
      await user.save();

      console.log("User updated:", user); // ✅ Vérifie si l'utilisateur est bien mis à jour

      res.status(200).json({ message: 'Email verified successfully' });

  } catch (error) {
      console.error("Token verification error:", error);
      res.status(400).json({ message: 'Invalid or expired token' });
  }
};
  


const signin = async (req, res) => {
  const { email, password, recaptchaToken } = req.body;

  // Validation des champs nécessaires
  if (!email || !password || !recaptchaToken) {
    return res.status(400).json({ error: "All fields and reCAPTCHA are required" });
  }

  try {
    // Vérifier le reCAPTCHA avec Google
    const recaptchaVerify = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
      params: {
        secret: process.env.RECAPTCHA_SECRET, // Ajoute la clé secrète dans ton .env
        response: recaptchaToken,
      },
    });

    if (!recaptchaVerify.data.success) {
      return res.status(400).json({ error: "reCAPTCHA verification failed" });
    }
      // Vérifier si l'utilisateur existe
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(400).json({ msg: 'User not found' });
      }
      if (!user.isVerified) {
        return res.status(400).json({ msg: 'Please verify your email first' });
    }
      // Vérifier le mot de passe
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(400).json({ msg: 'Incorrect password' });
      }

      // Générer un token JWT
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Enregistrer le token JWT dans un cookie sécurisé (HTTPOnly)
      res.cookie('token', token, {
          httpOnly: true,  // Ne peut être accédé par JavaScript
          secure: process.env.NODE_ENV === 'production',  // Utilise 'secure' en mode production
          sameSite: 'Strict', // Empêche les attaques CSRF
          maxAge: 3600000, // Durée du cookie (1 heure)
      });

      // Retourner la réponse avec les informations de l'utilisateur
      res.status(200).json({
          msg: 'Login successful',
          token,
          user: {
              id: user._id,
              name: user.name,
              lastName: user.lastName, // Nom de famille
              birthDate: user.birthDate, // Date de naissance
              phone: user.phone, // Numéro de téléphone
              email: user.email, // Email
              image: user.image, // Image de profil
              state: user.state, // État de l'utilisateur (par exemple actif, inactif, etc.)
              coursepreferences: user.coursepreferences, // Préférences de cours
              refinterestpoints: user.refinterestpoints, // Points d'intérêt
              refmodules: user.refmodules, // Modules de référence
              reffriends: user.reffriends, // Amis de référence
              typeUser: user.typeUser,
              isVerified: user.isVerified

          },
      });
  } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
  }
};

const authenticate = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
      return res.status(401).json({ msg: 'No token provided, authorization denied' });
  }

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Sauvegarder l'utilisateur décodé dans `req.user`
      next();
  } catch (err) {
      console.error(err);
      return res.status(401).json({ msg: 'Token is not valid' });
  }
};
const editUser = async (req, res) => {
  try {
    console.log("Params:", req.params); // 🔍 Vérifie ce qui est reçu
    const { name, lastName, birthDate, phone, email, password } = req.body;
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    console.log("User ID:", userId); // 🔍 Vérifie si l'ID est défini

    const imagePath = req.file ? req.file.path : null;

    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let hashedPassword = user.password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        name: name || user.name,
        lastName: lastName || user.lastName,
        birthDate: birthDate || user.birthDate,
        phone: phone || user.phone,
        email: email || user.email,
        password: hashedPassword,
        image: imagePath || user.image
      },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getUserById = async (req, res) => {
  try {
      const { id } = req.params;

      // Vérifie si l'ID est valide
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
          return res.status(400).json({ error: "Invalid user ID format" });
      }

      const user = await User.findById(id);
      if (!user) {
          return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
  } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Internal server error" });
  }
};
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Send verification code via SMS
const sendVerificationCode = async (req, res) => {
  const { phone, } = req.body;

  try {
    if (!phone) {
      return res.status(400).json({ message: 'Numéro de téléphone est requis' });
    }

    // Find the user by phone number
    const user = await User.findOne({ phone });
    if (!user) {
      console.log("User not found:", phone);
      return res.status(404).json({ message: 'Numéro de téléphone non trouvé' });
    }

    // Generate a verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save the verification code in the user's record
    user.verificationCode = verificationCode;
    await user.save();

    // Send SMS with Twilio
    await client.messages.create({
      body: `Votre code de vérification est : ${verificationCode}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    res.status(200).json({ message: 'Code de vérification envoyé par SMS' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

// Verify the SMS code
const verifyCode = async (req, res) => {
  const { phone, code } = req.body;

  try {
    const user = await User.findOne({ phone });
    if (!user || user.verificationCode !== code) {
      return res.status(400).json({ message: 'Code invalide' });
    }
    res.status(200).json({ message: 'Code vérifié avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

// Reset password after code verification
const resetPassword = async (req, res) => {
  const { phone, password } = req.body;

  try {
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'Numéro de téléphone non trouvé' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.verificationCode = null; // Reset the verification code
    await user.save();

    res.status(200).json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};
/**
 * Nouvelle fonction : Envoi du code de vérification par e-mail uniquement pour la réinitialisation du mot de passe
 */
const forgotPasswordEmail = async (req, res) => {
  const { email } = req.body;

  try {
      if (!email) {
          return res.status(400).json({ message: "L'email est requis" });
      }

      // Recherche de l'utilisateur par e-mail
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      // Génération d'un code de vérification à 6 chiffres
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Sauvegarde du code dans la base de données
      user.verificationCode = verificationCode;
      await user.save();

      // Contenu amélioré du mail
      const emailSubject = '🔐 Réinitialisation de votre mot de passe';
      const emailBody = `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.5;
          color: #333;
        }
        .container {
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          max-width: 500px;
          margin: auto;
          background-color: #f9f9f9;
        }
        .code {
          font-size: 20px;
          font-weight: bold;
          color: #d9534f;
        }
        .footer {
          margin-top: 20px;
          font-size: 14px;
          color: #777;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <p>Hello ${user.name},</p>
        <p>We received a password reset request for your account.</p>
        <p>Your verification code is: <span class="code">${verificationCode}</span></p>
        <p>Please enter this code in the application to proceed with resetting your password.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
        <p class="footer">Best regards,<br>CAMPX Team</p>
      </div>
    </body>
  </html>
`;


      

      // Envoi du mail avec format HTML
      await sendEmail(email, emailSubject, emailBody);

      res.status(200).json({ message: 'Code de vérification envoyé par e-mail' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

  
  /**
   * Nouvelle fonction : Réinitialisation du mot de passe après vérification par e-mail
   */
  const resetPasswordEmail = async (req, res) => {
    const { email, code, password } = req.body;
  
    try {
      if (!email || !code || !password) {
        return res.status(400).json({ message: 'Email, code et nouveau mot de passe sont requis' });
      }
  
      // Recherche de l'utilisateur par e-mail
      const user = await User.findOne({ email });
      if (!user || user.verificationCode !== code) {
        return res.status(400).json({ message: 'Code invalide ou utilisateur non trouvé' });
      }
  
      // Hachage du nouveau mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.verificationCode = null; // Réinitialisation du code de vérification
      await user.save();
  
      res.status(200).json({ message: 'Mot de passe mis à jour avec succès' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erreur interne du serveur' });
    }
  };

  const googleTokenAuth = async (req, res) => {
    try {
        const { token } = req.body;
        const decoded = jwt.decode(token);

        let user = await User.findOne({ email: decoded.email });

        if (!user) {
            user = new User({
                googleId: decoded.sub,
                name: decoded.name,
                email: decoded.email,
                typeUser: "user",
                image: decoded.picture, // Stocke l'URL de la photo de profil Google
            });
            await user.save();
        } else {
            // Met à jour l'image de l'utilisateur avec l'image Google s'il n'a pas déjà une image locale
            if (!user.image || user.image.startsWith("uploads/")) {
                user.image = decoded.picture;
                await user.save();
            }
        }

        const appToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        res.json({ token: appToken, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur d'authentification Google" });
    }
};


  
  module.exports = { googleTokenAuth,signup,authenticate, signin, checkEmailExists,verifyEmail, sendVerificationCode,editUser,getUserById, verifyCode, resetPassword, resetPasswordEmail, forgotPasswordEmail };
  