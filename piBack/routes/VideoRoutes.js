const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { authMiddleware } = require("../middleware/authMiddleware");

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

// Contrôleur des vidéos
const videoController = require("../controllers/VideoController");

// Routes publiques
router.get("/course/:courseId", videoController.getVideosByCourse);

// Routes protégées
router.post("/", authMiddleware, upload.single("video"), videoController.uploadVideo);
router.put("/:id", authMiddleware, upload.single("video"), videoController.updateVideo);
router.delete("/:id", authMiddleware, videoController.deleteVideo);

module.exports = router;
