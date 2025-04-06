const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { validateImage } = require('../controllers/authController');

// Configuration de multer pour le téléchargement d'images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Route pour la validation d'image
router.post('/validate-image', upload.single('image'), validateImage);

// ... existing routes ...

module.exports = router; 