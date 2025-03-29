const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { uploadVideo, createVideo, getCourseVideos, getVideo, updateVideo, deleteVideo } = require('../controllers/videoController');

// Configuration de Multer pour l'upload des vidéos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/videos"); // Le dossier où les vidéos seront stockées
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nom unique basé sur le timestamp
  },
});

const upload = multer({ storage });

// Routes vidéo sans authentification
router.post('/', upload.single('video'), createVideo);
router.get('/course/:courseId', getCourseVideos);
router.get('/:id', getVideo);
router.put('/:id', upload.single('video'), updateVideo);
router.delete('/:id', deleteVideo);

module.exports = router;
