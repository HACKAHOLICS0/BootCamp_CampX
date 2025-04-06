const multer = require('multer');

// Configuration de multer pour l'upload des fichiers
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Définir le répertoire pour stocker les images
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Ajouter un timestamp au nom du fichier
    }
});

const upload = multer({ storage: storage });

module.exports = upload;
