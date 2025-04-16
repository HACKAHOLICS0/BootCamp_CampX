import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import { FaPlay, FaQuestionCircle, FaComments, FaClock, FaTrophy, FaChartLine } from 'react-icons/fa';
import Cookies from 'js-cookie';
import config from '../../config';
import InteractiveVideoPlayer from './InteractiveVideoPlayer';
import './CourseView.css';
import CourseProgress from '../user/Course/CourseProgress';

const CourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('video');
  const [progress, setProgress] = useState(0);
  const { categoryId, moduleId } = useParams();

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = Cookies.get('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Récupérer les données du cours
      const response = await fetch(`${config.API_URL}/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch course data');
      }

      const data = await response.json();
      console.log("Course data received:", data);
      setCourse(data);

      // Récupérer les vidéos du cours
      const videosResponse = await fetch(`${config.API_URL}/api/videos/course/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (videosResponse.ok) {
        const videosData = await videosResponse.json();
        // Format video URLs to include the full server URL
        const formattedVideos = videosData.map(video => ({
          ...video,
          videoUrl: video.videoUrl ? `${config.API_URL}/${video.videoUrl}` : null
        }));
        setVideos(formattedVideos);
        if (formattedVideos.length > 0) {
          setSelectedVideo(formattedVideos[0]);
        }
      }

      // Extraire les IDs des quiz correctement
      const quizIds = data.quizzes || [];
      // S'assurer que nous avons des IDs valides
      const validQuizIds = quizIds.map(quiz => {
        if (typeof quiz === 'string') return quiz;
        if (quiz._id) return quiz._id;
        if (quiz._doc && quiz._doc._id) return quiz._doc._id;
        return null;
      }).filter(id => id !== null);

      console.log("Quiz IDs to fetch:", validQuizIds);

      if (validQuizIds.length > 0) {
        try {
          const quizPromises = validQuizIds.map(quizId =>
            fetch(`${config.API_URL}/api/quiz/${quizId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            }).then(async (res) => {
              if (!res.ok) {
                console.warn(`Impossible de récupérer le quiz ${quizId}:`, res.status);
                return null;
              }
              const quizData = await res.json();
              console.log(`Quiz ${quizId} data:`, quizData);

              // Récupérer les résultats du quiz pour l'utilisateur actuel
              const resultsResponse = await fetch(`${config.API_URL}/api/quiz/results/${quizId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json'
                }
              });

              let completed = false;
              if (resultsResponse.ok) {
                const results = await resultsResponse.json();
                completed = results.length > 0;
              }

              return {
                ...quizData,
                _id: quizId,
                title: quizData.title || quizData.nom || 'Quiz sans titre',
                duration: quizData.duration || quizData.duree || quizData.chronoVal || 0,
                completed
              };
            }).catch(error => {
              console.warn(`Erreur lors de la récupération du quiz ${quizId}:`, error);
              return null;
            })
          );

          const quizDetails = await Promise.all(quizPromises);
          console.log("All quiz details received:", quizDetails);



         // Filtrer les quiz valides
         const validQuizzes = quizDetails.filter(quiz => quiz !== null);
         console.log("Valid quizzes after processing:", validQuizzes);
         setQuizzes(validQuizzes);

         // Calculer la progression
         if (validQuizzes.length > 0) {
           const completedQuizzes = validQuizzes.filter(quiz => quiz.completed).length;
           const progressPercentage = (completedQuizzes / validQuizzes.length) * 100;
           setProgress(progressPercentage);
         }
       } catch (error) {
         console.error('Error fetching quiz details:', error);
         setError('Erreur lors de la récupération des quiz. Veuillez rafraîchir la page.');
       }
     } else {
       console.log("No quizzes found for this course");
       setQuizzes([]);
       setProgress(0);
     }

     setLoading(false);
   } catch (error) {
     console.error('Error fetching course:', error);
     setError(error.message);
     setLoading(false);
   }
 };

  const startQuiz = (quizId) => {
    navigate(`/categories/${categoryId}/modules/${moduleId}/courses/${courseId}/quiz/${quizId}`);

  };

  const formatDuration = (duration) => {
    if (!duration && duration !== 0) return 'Durée non définie';
    return `${duration} ${duration <= 1 ? 'minute' : 'minutes'}`;
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
        <h1>{course.titre}</h1>
        <p>{course.description}</p>
      </div>

      <div className="course-content">
        <div className="main-content">
          <div className="content-tabs">
            <div 
              className={`content-tab ${activeTab === 'video' ? 'active' : ''}`}
              onClick={() => setActiveTab('video')}
            >
              <FaPlay /> Vidéos
            </div>
            <div 
              className={`content-tab ${activeTab === 'quiz' ? 'active' : ''}`}
              onClick={() => setActiveTab('quiz')}
            >
              <FaQuestionCircle /> Quiz
            </div>
            <div 
              className={`content-tab ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <FaComments /> Discussion
            </div>
          </div>

          <div className="content-section">
            {activeTab === 'video' && (
              <div className="video-section-container">
                {videos && videos.length > 0 ? (
                  <>
                    <div className="video-player-container">
                      {selectedVideo && (
                        <InteractiveVideoPlayer 
                          videoUrl={selectedVideo.videoUrl}
                          videoTitle={selectedVideo.title}
                          onQuestionAnswered={(answer, question) => {
                            console.log('Réponse:', answer, 'Question:', question);
                          }}
                        />
                      )}
                    </div>
                    <div className="video-list">
                      <h3>Liste des vidéos</h3>
                      {videos.map((video) => (
                        <div
                          key={video._id}
                          className={`video-item ${selectedVideo?._id === video._id ? 'active' : ''}`}
                          onClick={() => setSelectedVideo(video)}
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
            )}

{activeTab === 'quiz' && (
              <div className="quiz-list">
                {quizzes && quizzes.length > 0 ? (
                  quizzes.map((quiz, index) => (
                    <div key={quiz._id} className="quiz-card">
                      <div className="quiz-info">
                        <h3>{quiz.title}</h3>
                        <div className="quiz-meta">
                          <span>
                            <FaClock /> 
                            {formatDuration(quiz.duration)}
                          </span>
                          <span>
                            <FaQuestionCircle /> 
                            {quiz.Questions ? quiz.Questions.length : 0} questions
                          </span>
                          {quiz.completed && (
                            <span className="completed-badge">
                              ✓ Complété
                            </span>
                          )}
                        </div>
                      </div>
                      <button 
                        className="start-quiz-btn"
                        onClick={() => startQuiz(quiz._id)}
                      >
                        <FaPlay /> {quiz.completed ? 'Recommencer' : 'Commencer'}
                      </button>
                    </div>
                  ))
                )  : (
                  <div className="no-quiz-message">
                    <FaQuestionCircle size={48} />
                    <h3>Aucun quiz disponible</h3>
                    <p>Les quiz pour ce cours seront bientôt disponibles.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="chatroom-placeholder">
                <FaComments size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h3>Chat room</h3>
             <button onClick={() => navigate(`/chat`)}>Chat</button>
              </div>
            )}
          </div>
        </div>

        <div className="sidebar">
          <div className="sidebar-card">
            <h2>Progression</h2>
            <CourseProgress 
              completedQuizzes={quizzes.filter(q => q.completed).length}
              totalQuizzes={quizzes.length}
            />
          </div>

          <div className="sidebar-card">
            <h2>Statistiques</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Temps estimé</span>
                <span>{course.duree || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Niveau</span>
                <span style={{ color: '#28a745' }}>{course.niveau || 'Intermédiaire'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Quiz complétés</span>
                <span>{quizzes.filter(q => q.completed).length}/{quizzes.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseView;