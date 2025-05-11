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
  const { name, lastName, birthDate, phone, email, password } = req.body; // 'lastName' ici
  const imagePath = req.file ? req.file.path : null; // R�cup�re le chemin de l'image t�l�charg�e

  // Validation des champs n�cessaires
  if (!name || !lastName || !birthDate || !phone || !email || !password) {  // 'lastName' ici
      return res.status(400).json({ error: 'All fields are required' });
  }

  try {
      // V�rifie si l'utilisateur existe d�j�
      const existingUser = await User.findOne({ email });
      if (existingUser) {
          return res.status(400).json({ error: 'Email already exists' });
      }

      // Validate face if image is provided
      if (imagePath) {
          try {
              const faceValidation = await validateFace(imagePath);
              if (!faceValidation.isValid) {
                  return res.status(400).json({ error: faceValidation.message });
              }
          } catch (validationError) {
              console.error('Face validation error:', validationError);
              return res.status(400).json({ error: 'Error validating profile image' });
          }
      }

      // Hacher le mot de passe avant de le sauvegarder
      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' }); // Augment� � 24 heures

      // Cr�er un nouvel utilisateur
      const newUser = new User({
          name,
          lastName, // 'lastName' ici
          birthDate,
          phone,
          email,
          typeUser: "user", // Ajouter le type d'utilisateur
          password: hashedPassword, // Mot de passe hach�
          image: imagePath, // Ajouter l'image
          emailVerificationToken: verificationToken, // ? Stocke le token
          isVerified: false // S'assurer que l'utilisateur n'est pas v�rifi� par d�faut
      });

      // Sauvegarder l'utilisateur dans la base de donn�es
      const savedUser = await newUser.save();
      console.log('User saved successfully:', savedUser._id);

      try {
          // Envoyer l'email de v�rification
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

          // Envoyer l'email
          await sendEmail(newUser.email, emailSubject, emailBody);
          console.log('Verification email sent to:', newUser.email);

          // Renvoyer la r�ponse avec les informations appropri�es
          return res.status(201).json({
              message: 'User registered successfully. Please check your email to verify your account.',
              userId: savedUser._id,
              isVerified: savedUser.isVerified
          });
      } catch (emailError) {
          console.error('Error sending verification email:', emailError);
          // M�me si l'envoi d'email �choue, l'utilisateur a �t� cr�� avec succ�s
          return res.status(201).json({
              message: 'User registered successfully, but we could not send the verification email. Please contact support.',
              userId: savedUser._id,
              isVerified: savedUser.isVerified
          });
      }
  } catch (error) {
      console.error('Error during signup:', error);
      // V�rifier si l'erreur est li�e � la validation MongoDB
      if (error.name === 'ValidationError') {
          const validationErrors = Object.values(error.errors).map(err => err.message);
          return res.status(400).json({ error: validationErrors.join(', ') });
      }
      // Erreur g�n�rique
      return res.status(500).json({ error: 'Internal server error during registration. Please try again later.' });
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.params;
  console.log("Received token:", token); // ? Affiche le token re�u

  try {
      // V�rifier le token
      let decoded;
      try {
          decoded = jwt.verify(token, process.env.JWT_SECRET);
          console.log("Decoded token:", decoded); // ? Affiche les infos du token
      } catch (jwtError) {
          console.error("JWT verification error:", jwtError);

          // V�rifier si l'erreur est due � l'expiration du token
          if (jwtError.name === 'TokenExpiredError') {
              return res.status(400).json({
                  message: 'Verification link has expired. Please request a new verification email.',
                  expired: true
              });
          }

          return res.status(400).json({ message: 'Invalid verification token' });
      }

      // Trouver l'utilisateur avec cet email
      const user = await User.findOne({ email: decoded.email });

      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // V�rifier si l'utilisateur est d�j� v�rifi�
      if (user.isVerified) {
          return res.status(200).json({ message: 'Email already verified. You can log in.' });
      }

      // V�rifier si le token correspond
      if (user.emailVerificationToken !== token) {
          return res.status(400).json({ message: 'Invalid verification token' });
      }

      // Mettre � jour l'utilisateur comme v�rifi�
      user.isVerified = true;
      user.emailVerificationToken = null; // ? Supprime le token apr�s v�rification
      await user.save();

      console.log("User updated:", user); // ? V�rifie si l'utilisateur est bien mis � jour

      res.status(200).json({ message: 'Email verified successfully' });

  } catch (error) {
      console.error("General verification error:", error);
      res.status(500).json({ message: 'Server error during verification' });
  }
};
const validateImage = async (req, res) => {
  if (!req.file) {
      return res.status(400).json({
          isValid: false,
          message: 'Aucune image fournie'
      });
  }

  try {
      console.log("Fichier re�u:", req.file);

      // V�rifier si le fichier existe
      const fs = require('fs');
      if (!fs.existsSync(req.file.path)) {
          console.error(`Le fichier n'existe pas: ${req.file.path}`);
          return res.status(400).json({
              isValid: false,
              message: "Le fichier image n'a pas �t� correctement t�l�charg�"
          });
      }

      // V�rifier si le fichier est une image
      if (!req.file.mimetype.startsWith('image/')) {
          console.error(`Le fichier n'est pas une image: ${req.file.mimetype}`);
          return res.status(400).json({
              isValid: false,
              message: "Le fichier doit �tre une image (jpg, png, etc.)"
          });
      }

      // V�rifier la taille du fichier
      if (req.file.size > 5 * 1024 * 1024) { // 5MB
          console.error(`Le fichier est trop grand: ${req.file.size} octets`);
          return res.status(400).json({
              isValid: false,
              message: "L'image est trop grande (max 5MB)"
          });
      }

      try {
          // Utiliser le chemin absolu pour le fichier
          const absolutePath = path.resolve(req.file.path);
          console.log(`Chemin absolu du fichier: ${absolutePath}`);

          // V�rifier � nouveau si le fichier existe avec le chemin absolu
          if (!fs.existsSync(absolutePath)) {
              console.error(`Le fichier n'existe pas avec le chemin absolu: ${absolutePath}`);
              return res.status(400).json({
                  isValid: false,
                  message: "Le fichier image n'a pas �t� correctement t�l�charg�"
              });
          }

          // V�rifier si le fichier est lisible
          try {
              fs.accessSync(absolutePath, fs.constants.R_OK);
              console.log(`Le fichier est lisible: ${absolutePath}`);
          } catch (accessError) {
              console.error(`Le fichier n'est pas lisible: ${absolutePath}`, accessError);
              return res.status(400).json({
                  isValid: false,
                  message: "Le fichier image n'est pas accessible en lecture"
              });
          }

          const faceValidation = await validateFace(absolutePath);
          console.log("R�sultat de la validation:", faceValidation);

          // V�rifier que la r�ponse est bien form�e
          if (typeof faceValidation !== 'object' || faceValidation === null) {
              console.error("R�ponse de validation invalide:", faceValidation);
              return res.status(500).json({
                  isValid: false,
                  message: "Erreur lors de la validation: r�ponse invalide"
              });
          }

          // S'assurer que la r�ponse contient les champs attendus
          if (!('isValid' in faceValidation) || !('message' in faceValidation)) {
              console.error("R�ponse de validation incompl�te:", faceValidation);
              return res.status(500).json({
                  isValid: false,
                  message: "Erreur lors de la validation: r�ponse incompl�te"
              });
          }

          // Renvoyer la r�ponse au client
          return res.json({
              isValid: Boolean(faceValidation.isValid),
              message: String(faceValidation.message || "")
          });
      } catch (validationError) {
          console.error("Erreur lors de la validation faciale:", validationError);
          return res.status(500).json({
              isValid: false,
              message: `Erreur lors de la validation faciale: ${validationError.message}`
          });
      }
  } catch (error) {
      console.error("Erreur g�n�rale lors de la validation de l'image:", error);
      return res.status(500).json({
          isValid: false,
          message: `Erreur lors de la validation: ${error.message}`
      });
  }
};

const validateFace = async (imagePath) => {
  console.log(`Validation du visage pour l'image: ${imagePath}`);

  // V rifier si le fichier existe
  const fs = require('fs');
  if (!fs.existsSync(imagePath)) {
    console.error(`Le fichier n'existe pas: ${imagePath}`);
    return { isValid: false, message: "Le fichier image n'existe pas" };
  }

  return new Promise((resolve) => {
      // Utiliser le chemin absolu pour le script Python
      const scriptPath = path.resolve(__dirname, '../scripts/face_validator_cli.py');
      console.log(`Chemin du script Python: ${scriptPath}`);

      // V rifier si le script Python existe
      if (!fs.existsSync(scriptPath)) {
        console.error(`Le script Python n'existe pas: ${scriptPath}`);
        resolve({ isValid: false, message: "Erreur de configuration: script Python introuvable" });
        return;
      }

      // Utiliser le chemin absolu pour l'image
      const absoluteImagePath = path.resolve(imagePath);
      console.log(`Chemin absolu de l'image: ${absoluteImagePath}`);

      // Utiliser python3 au lieu de python
      const pythonCommand = 'python3';
      console.log(`Utilisation de la commande Python: ${pythonCommand}`);

      // Lancer le processus Python avec des arguments explicites
      const pythonProcess = spawn(pythonCommand, [
          scriptPath,
          absoluteImagePath
      ]);

      let result = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
          const chunk = data.toString();
          console.log(`Sortie Python: ${chunk}`);
          result += chunk;
      });

      pythonProcess.stderr.on('data', (data) => {
          const chunk = data.toString();
          console.error(`Erreur Python: ${chunk}`);
          error += chunk;
      });

      // D finir un timeout pour le processus Python
      const timeout = setTimeout(() => {
          console.error('Timeout: Le processus Python prend trop de temps');
          pythonProcess.kill();
          resolve({ isValid: false, message: "Timeout lors de la validation du visage" });
      }, 30000); // 30 secondes

      pythonProcess.on('close', (code) => {
          clearTimeout(timeout); // Annuler le timeout
          console.log(`Process Python termin  avec le code: ${code}`);

          if (code !== 0) {
              console.error('Python script error:', error);
              // Au lieu de rejeter, on renvoie une r ponse d'erreur
              resolve({ isValid: false, message: "Erreur lors de l'ex cution du script de validation" });
              return;
          }

          try {
              // Nettoyez la r ponse pour s'assurer qu'elle est un JSON valide
              let cleanResult = result.trim();
              console.log(`R sultat nettoy : ${cleanResult}`);

              if (!cleanResult) {
                  console.error('R ponse vide du script Python');
                  resolve({ isValid: false, message: 'R ponse vide du script Python' });
                  return;
              }

              // Recherche d'un objet JSON complet dans la r ponse
              const jsonRegex = /(\{.*\})/s;  // Regex pour trouver un objet JSON complet
              const match = cleanResult.match(jsonRegex);

              if (match && match[1]) {
                  // Extraire uniquement la partie JSON de la r ponse
                  let jsonString = match[1];
                  console.log(`JSON extrait par regex: ${jsonString}`);

                  try {
                      const response = JSON.parse(jsonString);
                      console.log(`R ponse pars e:`, response);

                      // V rifier que la r ponse contient les champs attendus
                      if (response.hasOwnProperty('isValid') && response.hasOwnProperty('message')) {
                          resolve(response);
                      } else {
                          console.error('R ponse JSON incompl te:', response);
                          resolve({
                              isValid: false,
                              message: "R ponse incompl te du script de validation"
                          });
                      }
                  } catch (e) {
                      console.error('Parse error:', e, 'JSON string:', jsonString);

                      // Tentative alternative: chercher le dernier objet JSON valide
                      try {
                          // Trouver le dernier objet JSON dans la cha ne
                          const lastJsonStart = cleanResult.lastIndexOf('{');
                          const lastJsonEnd = cleanResult.lastIndexOf('}');

                          if (lastJsonStart !== -1 && lastJsonEnd !== -1 && lastJsonEnd > lastJsonStart) {
                              jsonString = cleanResult.substring(lastJsonStart, lastJsonEnd + 1);
                              console.log(`Dernier JSON trouv : ${jsonString}`);

                              const response = JSON.parse(jsonString);
                              console.log(`R ponse pars e (dernier JSON):`, response);

                              if (response.hasOwnProperty('isValid') && response.hasOwnProperty('message')) {
                                  resolve(response);
                                  return;
                              }
                          }

                          // Si on arrive ici, c'est qu'on n'a pas trouv  de JSON valide
                          throw new Error("Aucun JSON valide trouv ");
                      } catch (e2) {
                          console.error('Second parse error:', e2);
                          resolve({
                              isValid: false,
                              message: "Erreur de format dans la r ponse du script"
                          });
                      }
                  }
              } else {
                  console.error('Aucun JSON valide trouv  par regex dans:', cleanResult);

                  // Derni re tentative: chercher manuellement les accolades
                  try {
                      const lastOpenBrace = cleanResult.lastIndexOf('{');
                      const lastCloseBrace = cleanResult.lastIndexOf('}');

                      if (lastOpenBrace !== -1 && lastCloseBrace !== -1 && lastCloseBrace > lastOpenBrace) {
                          const jsonString = cleanResult.substring(lastOpenBrace, lastCloseBrace + 1);
                          console.log(`JSON extrait manuellement: ${jsonString}`);

                          const response = JSON.parse(jsonString);
                          console.log(`R ponse pars e (extraction manuelle):`, response);

                          if (response.hasOwnProperty('isValid') && response.hasOwnProperty('message')) {
                              resolve(response);
                              return;
                          }
                      }
                  } catch (e3) {
                      console.error('Extraction manuelle  chou e:', e3);
                  }

                  // Si toutes les tentatives  chouent, renvoyer une erreur
                  resolve({
                      isValid: false,
                      message: "Format de r ponse invalide du script de validation"
                  });
              }
          } catch (e) {
              console.error('General error:', e, 'Raw result:', result);
              resolve({
                  isValid: false,
                  message: "Erreur lors du traitement de la r ponse"
              });
          }
      });

      // G rer les erreurs de lancement du processus
      pythonProcess.on('error', (err) => {
          clearTimeout(timeout); // Annuler le timeout
          console.error('Failed to start Python process:', err);
          resolve({ isValid: false, message: "Impossible de lancer le script de validation" });
      });
  });
};


const signin = async (req, res) => {
  const { email, password, recaptchaToken } = req.body;

  // Validation des champs n�cessaires
  if (!email || !password || !recaptchaToken) {
    return res.status(400).json({ error: "All fields and reCAPTCHA are required" });
  }

  try {
    // V�rifier le reCAPTCHA avec Google
    const recaptchaVerify = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
      params: {
        secret: process.env.RECAPTCHA_SECRET, // Ajoute la cl� secr�te dans ton .env
        response: recaptchaToken,
      },
    });

    if (!recaptchaVerify.data.success) {
      return res.status(400).json({ error: "reCAPTCHA verification failed" });
    }
      // V�rifier si l'utilisateur existe
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(400).json({ msg: 'User not found' });
      }
      if (!user.isVerified) {
        return res.status(400).json({ msg: 'Please verify your email first' });
    }
      // V�rifier le mot de passe
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(400).json({ msg: 'Incorrect password' });
      }

      // G�n�rer un token JWT
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '6h' });

      // Enregistrer le token JWT dans un cookie s�curis� (HTTPOnly)
      res.cookie('token', token, {
          httpOnly: true,  // Ne peut �tre acc�d� par JavaScript
          secure: process.env.NODE_ENV === 'production',  // Utilise 'secure' en mode production
          sameSite: 'Strict', // Emp�che les attaques CSRF
          maxAge: 3600000, // Dur�e du cookie (1 heure)
      });

      // Retourner la r�ponse avec les informations de l'utilisateur
      res.status(200).json({
          msg: 'Login successful',
          token,
          user: {
              id: user._id,
              name: user.name,
              lastName: user.lastName, // Nom de famille
              birthDate: user.birthDate, // Date de naissance
              phone: user.phone, // Num�ro de t�l�phone
              email: user.email, // Email
              image: user.image, // Image de profil
              state: user.state, // �tat de l'utilisateur (par exemple actif, inactif, etc.)
              coursepreferences: user.coursepreferences, // Pr�f�rences de cours
              refinterestpoints: user.refinterestpoints, // Points d'int�r�t
              refmodules: user.refmodules, // Modules de r�f�rence
              reffriends: user.reffriends, // Amis de r�f�rence
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
      req.user = decoded; // Sauvegarder l'utilisateur d�cod� dans `req.user`
      next();
  } catch (err) {
      console.error(err);
      return res.status(401).json({ msg: 'Token is not valid' });
  }
};
const editUser = async (req, res) => {
  try {
    console.log("Params:", req.params); // ?? V�rifie ce qui est re�u
    const { name, lastName, birthDate, phone, email, password } = req.body;
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    console.log("User ID:", userId); // ?? V�rifie si l'ID est d�fini

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

      // V�rifie si l'ID est valide
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
      return res.status(400).json({ message: 'Num�ro de t�l�phone est requis' });
    }

    // Find the user by phone number
    const user = await User.findOne({ phone });
    if (!user) {
      console.log("User not found:", phone);
      return res.status(404).json({ message: 'Num�ro de t�l�phone non trouv�' });
    }

    // Generate a verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save the verification code in the user's record
    user.verificationCode = verificationCode;
    await user.save();

    // Send SMS with Twilio
    await client.messages.create({
      body: `Votre code de v�rification est : ${verificationCode}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    res.status(200).json({ message: 'Code de v�rification envoy� par SMS' });
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
    res.status(200).json({ message: 'Code v�rifi� avec succ�s' });
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
      return res.status(404).json({ message: 'Num�ro de t�l�phone non trouv�' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.verificationCode = null; // Reset the verification code
    await user.save();

    res.status(200).json({ message: 'Mot de passe mis � jour avec succ�s' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};
/**
 * Nouvelle fonction : Envoi du code de v�rification par e-mail uniquement pour la r�initialisation du mot de passe
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
          return res.status(404).json({ message: 'Utilisateur non trouv�' });
      }

      // G�n�ration d'un code de v�rification � 6 chiffres
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Sauvegarde du code dans la base de donn�es
      user.verificationCode = verificationCode;
      await user.save();

      // Contenu am�lior� du mail
      const emailSubject = '?? R�initialisation de votre mot de passe';
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

      res.status(200).json({ message: 'Code de v�rification envoy� par e-mail' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};


  /**
   * Nouvelle fonction : R�initialisation du mot de passe apr�s v�rification par e-mail
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
        return res.status(400).json({ message: 'Code invalide ou utilisateur non trouv�' });
      }

      // Hachage du nouveau mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.verificationCode = null; // R�initialisation du code de v�rification
      await user.save();

      res.status(200).json({ message: 'Mot de passe mis � jour avec succ�s' });
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
                isVerified: true // Les utilisateurs Google sont automatiquement v�rifi�s
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
