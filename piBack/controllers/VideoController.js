const Video = require("../Model/Video");
const multer = require("multer");
const path = require("path");

// Configuration de multer pour stocker les vidéos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads"); // Où les fichiers seront enregistrés
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nom du fichier unique
  },
});

const upload = multer({ storage: storage });

// Contrôleur pour uploader la vidéo
const uploadVideo = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Aucun fichier n'a été téléchargé." });
  }
  
  // Tu peux ici sauvegarder les informations dans la base de données, si nécessaire
  res.status(200).json({ message: "Vidéo téléchargée avec succès!", file: req.file });
};

module.exports = { upload, uploadVideo };
