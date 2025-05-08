const multer = require('multer');
const path = require('path');
const fs = require('fs');

// S'assurer que le répertoire uploads existe
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Répertoire créé: ${uploadDir}`);
}

// Filtre pour vérifier que le fichier est une image
const fileFilter = (req, file, cb) => {
    // Accepter uniquement les images
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Le fichier doit être une image (jpg, png, etc.)'), false);
    }
};

// Configuration de multer pour l'upload des fichiers
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Utiliser le chemin absolu
    },
    filename: function (req, file, cb) {
        // Nettoyer le nom du fichier
        const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, Date.now() + '-' + sanitizedFilename); // Ajouter un timestamp au nom du fichier
    }
});

// Configuration de multer avec des limites et un filtre
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
    fileFilter: fileFilter
});

// Middleware pour gérer les erreurs de multer
const handleMulterErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Erreur de multer
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                isValid: false,
                message: "L'image est trop grande (max 5MB)"
            });
        }
        return res.status(400).json({
            isValid: false,
            message: `Erreur lors du téléchargement: ${err.message}`
        });
    } else if (err) {
        // Autre erreur
        return res.status(400).json({
            isValid: false,
            message: err.message
        });
    }
    next();
};

module.exports = upload;
module.exports.handleMulterErrors = handleMulterErrors;
