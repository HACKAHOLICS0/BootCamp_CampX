import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import { FaPlay } from 'react-icons/fa';
import axios from 'axios';
import InteractiveVideoPlayer from './InteractiveVideoPlayer';
import './CourseView.css';

const CourseView = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les données du cours
      const response = await axios.get(`http://localhost:5000/api/courses/${courseId}`);
      setCourse(response.data);

      // Récupérer les vidéos du cours
      const videosResponse = await axios.get(`http://localhost:5000/api/videos/course/${courseId}`);
      
      // Formater les URLs des vidéos
      const formattedVideos = videosResponse.data.map(video => {
        if (!video || !video.videoUrl) return null;
        
        // Nettoyer l'URL de la vidéo
        let videoPath = video.videoUrl
          .replace(/^\/+/, '') // Supprimer les slashes au début
          .replace(/^uploads\//, ''); // Supprimer le préfixe 'uploads/' s'il existe
        
        // Construire l'URL complète pointant vers le serveur backend
        const fullVideoUrl = `http://localhost:5000/uploads/videos/${videoPath.split('/').pop()}`;
        
        return {
          ...video,
          fullVideoUrl
        };
      }).filter(Boolean);

      setVideos(formattedVideos);
      if (formattedVideos.length > 0) {
        setSelectedVideo(formattedVideos[0]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching course:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleVideoSelect = (video) => {
    console.log('handleVideoSelect called with video:', video);
    if (!video || !video._id) {
      console.error('Invalid video object:', video);
      return;
    }
    console.log('Setting selected video:', {
      id: video._id,
      title: video.title,
      url: video.fullVideoUrl
    });
    setSelectedVideo(video);
  };

  if (loading) {
    return (
      <div className="course-view-container">
        <div className="loading-container" style={{ textAlign: 'center', padding: '3rem' }}>
          <Spinner animation="border" variant="success" />
          <p className="mt-3">Chargement du cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-view-container">
        <Alert variant="danger">
          <Alert.Heading>Erreur</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-view-container">
        <Alert variant="info">
          <Alert.Heading>Cours non trouvé</Alert.Heading>
          <p>Le cours que vous recherchez n'existe pas ou n'est pas accessible.</p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="course-view-container">
      <div className="course-header">
        <h1>{course.title}</h1>
        <p>{course.description}</p>
      </div>

      <div className="course-content">
        <div className="main-content">
          <div className="video-section-container">
            {videos && videos.length > 0 ? (
              <>
                <div className="video-player-container">
                  {selectedVideo && (
                    <InteractiveVideoPlayer 
                      videoUrl={selectedVideo.fullVideoUrl}
                      quiz={selectedVideo.quiz || []}
                    />
                  )}
                </div>
                <div className="video-list">
                  <h3>Liste des vidéos</h3>
                  {videos.map((video) => (
                    <div
                      key={video._id}
                      className={`video-item ${selectedVideo?._id === video._id ? 'active' : ''}`}
                      onClick={() => handleVideoSelect(video)}
                      style={{ cursor: 'pointer' }}
                    >
                      <FaPlay className="video-icon" />
                      <div className="video-info">
                        <h4>{video.title}</h4>
                        <p>{video.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="no-video-message">
                <FaPlay size={48} />
                <h3>Aucune vidéo disponible</h3>
                <p>Les vidéos pour ce cours seront bientôt disponibles.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseView; 