const Video = require("../Model/Video");
const multer = require("multer");
const path = require("path");
const fs = require('fs');

// Configuration de multer pour stocker les vidéos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "./uploads/videos";
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Contrôleur pour uploader la vidéo
const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier n'a été téléchargé." });
    }

    const { title, description, courseId } = req.body;

    if (!title || !description || !courseId) {
      return res.status(400).json({ message: "Titre, description et courseId sont requis." });
    }

    const video = new Video({
      title,
      description,
      courseId,
      videoUrl: `/uploads/videos/${req.file.filename}`
    });

    await video.save();
    
    res.status(201).json({
      message: "Vidéo téléchargée avec succès!",
      video
    });
  } catch (error) {
    console.error("Erreur lors de l'upload de la vidéo:", error);
    res.status(500).json({ message: "Erreur lors de l'upload de la vidéo", error: error.message });
  }
};

// Récupérer toutes les vidéos d'un cours
const getVideosByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const videos = await Video.find({ courseId });
    res.json(videos);
  } catch (error) {
    console.error("Erreur lors de la récupération des vidéos:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des vidéos", error: error.message });
  }
};

// Mettre à jour une vidéo
const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      title: req.body.title,
      description: req.body.description
    };

    if (req.file) {
      updateData.videoUrl = `/uploads/videos/${req.file.filename}`;
      
      // Supprimer l'ancienne vidéo si elle existe
      const oldVideo = await Video.findById(id);
      if (oldVideo && oldVideo.videoUrl) {
        const oldPath = path.join(__dirname, '..', oldVideo.videoUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    const video = await Video.findByIdAndUpdate(id, updateData, { new: true });
    if (!video) {
      return res.status(404).json({ message: "Vidéo non trouvée" });
    }

    res.json(video);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la vidéo:", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de la vidéo", error: error.message });
  }
};

// Supprimer une vidéo
const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);
    
    if (!video) {
      return res.status(404).json({ message: "Vidéo non trouvée" });
    }

    // Supprimer le fichier vidéo
    if (video.videoUrl) {
      const filePath = path.join(__dirname, '..', video.videoUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await video.deleteOne();
    res.json({ message: "Vidéo supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la vidéo:", error);
    res.status(500).json({ message: "Erreur lors de la suppression de la vidéo", error: error.message });
  }
};

module.exports = {
  upload,
  uploadVideo,
  getVideosByCourse,
  updateVideo,
  deleteVideo
};
