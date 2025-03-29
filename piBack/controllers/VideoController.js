const Video = require("../Model/Video");
const path = require("path");
const fs = require("fs");
const videoAnalysisService = require("../services/videoAnalysisService");

// Fonction utilitaire pour construire l'URL de la vidéo
const buildVideoUrl = (filename) => {
  // S'assurer que le nom du fichier est propre
  const cleanFilename = filename.replace(/\\/g, '/');
  return `uploads/videos/${cleanFilename}`;
};

// Fonction utilitaire pour formater l'URL de la vidéo
const formatVideoUrl = (videoUrl) => {
  if (!videoUrl) return null;
  return videoUrl
    .replace(/\\/g, '/') // Remplacer les backslashes par des forward slashes
    .replace(/^\/+/, '') // Supprimer les slashes au début
    .replace(/\/+/g, '/'); // Remplacer les doubles slashes par un seul
};

// Create new video
const createVideo = async (req, res) => {
  try {
    const { title, description, courseId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Aucune vidéo n\'a été uploadée' });
    }

    // Construire l'URL de la vidéo
    const videoUrl = buildVideoUrl(req.file.filename);
    console.log('Creating video with URL:', videoUrl);

    // Analyser la vidéo et générer des questions
    const analysis = await videoAnalysisService.analyzeVideo(req.file.path);
    
    // Créer la vidéo avec les questions générées
    const video = new Video({
      title,
      description,
      courseId,
      videoUrl,
      quiz: analysis.questions
    });

    await video.save();
    
    // Formater la réponse
    const formattedVideo = {
      ...video.toObject(),
      videoUrl: formatVideoUrl(video.videoUrl)
    };
    
    console.log('Created video:', formattedVideo);
    res.status(201).json(formattedVideo);
  } catch (error) {
    console.error('Erreur lors de la création de la vidéo:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la vidéo' });
  }
};

// Get all videos for a course
const getCourseVideos = async (req, res) => {
  try {
    console.log('Fetching videos for course:', req.params.courseId);
    
    if (!req.params.courseId) {
      console.error('No courseId provided');
      return res.status(400).json({ message: 'CourseId is required' });
    }

    const videos = await Video.find({ courseId: req.params.courseId });
    console.log('Raw videos from database:', videos);
    
    if (!videos || videos.length === 0) {
      console.log('No videos found for course:', req.params.courseId);
      return res.json([]);
    }
    
    // Formater les URLs des vidéos
    const formattedVideos = videos.map(video => {
      const videoObj = video.toObject();
      console.log('Processing video:', videoObj);
      
      // S'assurer que videoUrl existe
      if (!videoObj.videoUrl) {
        console.warn('Video without URL:', videoObj._id);
        return {
          ...videoObj,
          videoUrl: null
        };
      }
      
      // Formater l'URL
      const formattedUrl = formatVideoUrl(videoObj.videoUrl);
      console.log('Formatted URL for video', videoObj._id, ':', formattedUrl);
      
      return {
        ...videoObj,
        videoUrl: formattedUrl
      };
    });
    
    console.log('Sending formatted videos:', formattedVideos);
    res.json(formattedVideos);
  } catch (error) {
    console.error('Error getting course videos:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single video with quiz
const getVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }
    
    // Formater l'URL de la vidéo
    const formattedVideo = {
      ...video.toObject(),
      videoUrl: formatVideoUrl(video.videoUrl)
    };
    
    console.log('Formatted video:', formattedVideo);
    res.json(formattedVideo);
  } catch (error) {
    console.error('Error getting video:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update video
const updateVideo = async (req, res) => {
  try {
    const { title, description, courseId } = req.body;
    const videoId = req.params.id;

    const updateData = {
      title,
      description,
      courseId
    };

    if (req.file) {
      const oldVideo = await Video.findById(videoId);
      if (oldVideo && oldVideo.videoUrl) {
        const oldPath = path.join(__dirname, "..", formatVideoUrl(oldVideo.videoUrl));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      
      // Construire la nouvelle URL de la vidéo
      updateData.videoUrl = buildVideoUrl(req.file.filename);
      console.log('Updating video with new URL:', updateData.videoUrl);
      
      // Analyser la nouvelle vidéo et générer des questions
      const analysis = await videoAnalysisService.analyzeVideo(req.file.path);
      updateData.quiz = analysis.questions;
    }

    const video = await Video.findByIdAndUpdate(
      videoId,
      updateData,
      { new: true }
    );

    if (!video) {
      return res.status(404).json({ message: 'Vidéo non trouvée' });
    }

    // Formater l'URL avant de renvoyer la réponse
    const formattedVideo = {
      ...video.toObject(),
      videoUrl: formatVideoUrl(video.videoUrl)
    };
    
    console.log('Updated video:', formattedVideo);
    res.json(formattedVideo);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la vidéo:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la vidéo' });
  }
};

// Delete video
const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    if (video.videoUrl) {
      const videoPath = path.join(__dirname, "..", formatVideoUrl(video.videoUrl));
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    }

    await video.deleteOne();
    res.json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createVideo, getCourseVideos, getVideo, updateVideo, deleteVideo };
