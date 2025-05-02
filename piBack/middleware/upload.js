const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier de destination s'il n'existe pas
const uploadDir = path.join(__dirname, '../uploads/events');
console.log('Upload directory path:', uploadDir);

try {
    if (!fs.existsSync(uploadDir)) {
        console.log('Creating upload directory...');
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('Upload directory created successfully');
    } else {
        console.log('Upload directory already exists');
    }
} catch (error) {
    console.error('Error creating upload directory:', error);
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Utiliser le chemin absolu pour éviter les problèmes de chemin relatif
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});

module.exports = upload;