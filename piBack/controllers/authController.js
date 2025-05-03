const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const twilio = require('twilio');
const User = require('../Model/User');
const axios = require("axios");
const { spawn } = require('child_process');
const path = require('path');
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

// Get current user profile
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.params.id; // Get the user ID from the URL parameters
    const user = await User.findById(userId); // Fetch the user from the database

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Return the user data you need, e.g., image
    res.json({ image: user.image }); // Adjust according to your user model
} catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
}
};

const signup = async (req, res) => {
  try {
    console.log("Données d'inscription reçues:", req.body);
    const { name, lastName, birthDate, phone, email, password } = req.body;
    const imagePath = req.file ? req.file.path : null;

    // Validation des champs nécessaires
    if (!name || !lastName || !email || !password) {
      console.log("Champs manquants:", { name: !!name, lastName: !!lastName, email: !!email, password: !!password });
      return res.status(400).json({ error: 'Name, lastName, email and password are required' });
    }

    // Vérifie si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Email déjà utilisé:", email);
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hacher le mot de passe avant de le sauvegarder
    const hashedPassword = await bcrypt.hash(password, 10);

    // Générer un token de vérification
    const jwtSecret = process.env.JWT_SECRET || 'fallbacksecret';
    console.log("Génération du token avec secret:", jwtSecret ? "Secret défini" : "Secret non défini");
    const verificationToken = jwt.sign({ email }, jwtSecret, { expiresIn: '24h' });

    // Convertir le numéro de téléphone en chaîne de caractères si nécessaire
    const phoneString = phone ? phone.toString() : '';

    // Créer un nouvel utilisateur
    const newUser = new User({
      name,
      lastName,
      birthDate: birthDate || new Date(), // Valeur par défaut si non fournie
      phone: phoneString,
      email,
      typeUser: "user",
      password: hashedPassword,
      image: imagePath,
      emailVerificationToken: verificationToken,
      authProvider: 'local', // Spécifier le fournisseur d'authentification
      isVerified: false // S'assurer que l'utilisateur n'est pas vérifié par défaut
    });

    console.log("Tentative de sauvegarde de l'utilisateur:", {
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      hasToken: !!newUser.emailVerificationToken
    });

    // Sauvegarder l'utilisateur dans la base de données
    const savedUser = await newUser.save();
    console.log("Utilisateur sauvegardé avec succès, ID:", savedUser._id);

    // Déterminer l'URL du client
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const verificationLink = `${clientUrl}/verify-email/${verificationToken}`;

    // Préparer l'email de vérification
    const emailSubject = 'Verify Your Email - CAMP X';
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
          .header {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">CAMP X</div>
          <p>Hello ${newUser.name},</p>
          <p>Thank you for registering. Please click the button below to verify your email address:</p>
          <p><a href="${verificationLink}" class="button">Verify Email</a></p>
          <p>If you did not request this, please ignore this email.</p>
          <p>Best regards,</p>
          <p>CAMP X Team</p>
        </div>
      </body>
      </html>
    `;

    try {
      // Envoyer l'email de vérification
      await sendEmail(newUser.email, emailSubject, emailBody);
      console.log("Email de vérification envoyé à:", newUser.email);
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email:", emailError);
      // Continuer même si l'envoi de l'email échoue
    }

    // Répondre avec succès
    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      userId: savedUser._id
    });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
const validateImage = async (req, res) => {
  console.log("Validation d'image demandée");

  if (!req.file) {
    console.log("Erreur: Aucune image fournie");
    return res.status(400).json({ error: 'Aucune image fournie' });
  }

  console.log("Image reçue:", req.file.path);

  try {
    // Vérifier si le fichier existe
    const fs = require('fs');
    if (!fs.existsSync(req.file.path)) {
      console.log("Erreur: Le fichier n'existe pas:", req.file.path);
      return res.status(400).json({ error: "Le fichier d'image n'existe pas" });
    }

    console.log("Appel de la fonction validateFace avec le chemin:", req.file.path);
    const faceValidation = await validateFace(req.file.path);
    console.log("Résultat de la validation:", faceValidation);
    res.json(faceValidation);
  } catch (error) {
    console.error("Erreur lors de la validation de l'image:", error);
    res.status(500).json({
      error: error.message,
      details: "Erreur lors de la validation de l'image. Veuillez réessayer avec une autre image."
    });
  }
};

const validateFace = async (imagePath) => {
  return new Promise((resolve, reject) => {
      // Utiliser python3 sur Linux/Mac et python sur Windows
      const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
      console.log(`Utilisation de la commande Python: ${pythonCommand}`);

      const scriptPath = path.join(__dirname, '../scripts/face_validator_cli.py');
      console.log(`Chemin du script: ${scriptPath}`);

      const pythonProcess = spawn(pythonCommand, [scriptPath, imagePath]);

      let result = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
          result += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
          error += data.toString();
      });

      pythonProcess.on('close', (code) => {
          if (code !== 0) {
              console.error('Python script error:', error);
              reject(new Error(error || 'Erreur lors de la validation du visage'));
          } else {
              try {
                  // Nettoyez la réponse pour s'assurer qu'elle est un JSON valide
                  const cleanResult = result.trim();
                  if (!cleanResult) {
                      reject(new Error('Réponse vide du script Python'));
                      return;
                  }

                  const response = JSON.parse(cleanResult);
                  resolve(response);
              } catch (e) {
                  console.error('Parse error:', e, 'Raw result:', result);
                  reject(new Error('Erreur lors du parsing de la réponse: ' + e.message));
              }
          }
      });
  });
};


const signin = async (req, res) => {
  try {
    console.log("Tentative de connexion reçue:", req.body);
    const { email, password, recaptchaToken } = req.body;

    // Validation des champs nécessaires
    if (!email || !password) {
      console.log("Champs manquants:", { email: !!email, password: !!password });
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Vérification du reCAPTCHA uniquement si le token est fourni et si on n'est pas en développement
    if (recaptchaToken && process.env.NODE_ENV === 'production') {
      try {
        console.log("Vérification du reCAPTCHA...");
        const recaptchaVerify = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
          params: {
            secret: process.env.RECAPTCHA_SECRET || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe', // Clé de test si non définie
            response: recaptchaToken,
          },
        });

        if (!recaptchaVerify.data.success) {
          console.log("Échec de la vérification reCAPTCHA");
          return res.status(400).json({ error: "reCAPTCHA verification failed" });
        }
      } catch (recaptchaError) {
        console.error("Erreur lors de la vérification reCAPTCHA:", recaptchaError);
        // En développement, on continue même si la vérification échoue
        if (process.env.NODE_ENV === 'production') {
          return res.status(400).json({ error: "reCAPTCHA verification error" });
        }
      }
    } else {
      console.log("Vérification reCAPTCHA ignorée en développement");
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
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '6h' });

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
      console.error("Erreur lors de la connexion:", err);
      res.status(500).json({
        msg: 'Server error',
        details: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
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

        // Rechercher l'utilisateur par Google ID
        let user = await User.findOne({ googleId: decoded.sub });

        if (!user) {
            user = new User({
                googleId: decoded.sub,
                name: decoded.name,
                email: decoded.email,
                typeUser: "user",
                image: decoded.picture,
                authProvider: 'google',
                isVerified: true // Les utilisateurs Google sont automatiquement vérifiés
            });
            await user.save();
        }

        const appToken = jwt.sign(
            {
                id: user._id,
                googleId: user.googleId,
                authProvider: user.authProvider
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ token: appToken, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur d'authentification Google" });
    }
};



  module.exports = { validateImage,validateFace,googleTokenAuth,signup,authenticate, signin, checkEmailExists,getCurrentUser,verifyEmail, sendVerificationCode,editUser,getUserById, verifyCode, resetPassword, resetPasswordEmail, forgotPasswordEmail };
