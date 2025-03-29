const Video = require("../Model/Video");
const path = require("path");
const fs = require("fs");
const videoAnalysisService = require("../services/videoAnalysisService");

// Create new video
const createVideo = async (req, res) => {
  try {
    const { title, description, courseId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Aucune vidéo n\'a été uploadée' });
    }

    // Analyser la vidéo et générer des questions
    const analysis = await videoAnalysisService.analyzeVideo(req.file.path);
    
    // Créer la vidéo avec les questions générées
    const video = new Video({
      title,
      description,
      courseId,
      videoUrl: `/uploads/videos/${req.file.filename}`,
      quiz: analysis.questions
    });

    await video.save();
    res.status(201).json(video);
  } catch (error) {
    console.error('Erreur lors de la création de la vidéo:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la vidéo' });
  }
};

// Get all videos for a course
const getCourseVideos = async (req, res) => {
  try {
    const videos = await Video.find({ courseId: req.params.courseId });
    res.json(videos);
  } catch (error) {
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
    res.json(video);
  } catch (error) {
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
        const oldPath = path.join(__dirname, "..", oldVideo.videoUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      updateData.videoUrl = `/uploads/videos/${req.file.filename}`;
      
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

    res.json(video);
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
      const videoPath = path.join(__dirname, "..", video.videoUrl);
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    }

    await video.deleteOne();
    res.json({ message: "Video deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createVideo, getCourseVideos, getVideo, updateVideo, deleteVideo };
