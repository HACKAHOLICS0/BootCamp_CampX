import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import { FaPlay, FaQuestionCircle, FaComments, FaClock, FaTrophy, FaChartLine, FaLock } from 'react-icons/fa';
import Cookies from 'js-cookie';
import config from '../../config';
import InteractiveVideoPlayer from './InteractiveVideoPlayer';
import './CourseView.css';
import CourseProgress from '../user/Course/CourseProgress';

const CourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'video');
  const [progress, setProgress] = useState(0);
  const { categoryId, moduleId } = useParams();

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Afficher tous les cookies disponibles pour le dÈbogage
      console.log("Tous les cookies disponibles:", document.cookie);
      
      // Parcourir tous les cookies et les afficher individuellement
      const allCookies = document.cookie.split(';');
      console.log("Liste de tous les cookies:");
      allCookies.forEach((cookie, index) => {
        const [name, value] = cookie.trim().split('=');
        console.log(`Cookie ${index + 1}: Nom="${name}", Valeur="${value ? value.substring(0, 10) + '...' : 'vide'}"`);
      });
      
      // Essayer de rÈcupÈrer le token avec js-cookie
      let token = Cookies.get('token');
      console.log("Token via Cookies.get('token'):", token ? token.substring(0, 10) + "..." : "Non trouvÈ");
      
      // Essayer d'autres noms possibles pour le cookie de token
      if (!token) {
        // Liste des noms possibles pour le cookie de token
        const possibleTokenNames = ['token', 'auth_token', 'jwt', 'authToken', 'access_token', 'sid', 'JSESSIONID'];
        
        for (const name of possibleTokenNames) {
          const possibleToken = Cookies.get(name);
          if (possibleToken) {
            console.log(`Token trouvÈ sous le nom "${name}": ${possibleToken.substring(0, 10)}...`);
            token = possibleToken;
            break;
          }
        }
      }
      
      // Si toujours pas de token, essayer de le rÈcupÈrer directement du document.cookie
      if (!token) {
        for (const cookie of allCookies) {
          const [name, value] = cookie.trim().split('=');
          if (name && value && ['token', 'auth_token', 'jwt', 'authToken', 'access_token', 'sid', 'JSESSIONID'].includes(name)) {
            console.log(`Token trouvÈ dans document.cookie sous le nom "${name}": ${value.substring(0, 10)}...`);
            token = decodeURIComponent(value);
            break;
          }
        }
      }
      
      // Si toujours pas de token, vÈrifier localStorage et sessionStorage
      if (!token) {
        token = localStorage.getItem('token') || sessionStorage.getItem('token');
        console.log("Token depuis localStorage/sessionStorage:", token ? token.substring(0, 10) + "..." : "Non trouvÈ");
      }
      
      // Si toujours pas de token, utiliser le cookie "sid" qui semble Ítre prÈsent dans votre capture d'Ècran
      if (!token) {
        token = Cookies.get('sid');
        console.log("Token depuis cookie 'sid':", token ? token.substring(0, 10) + "..." : "Non trouvÈ");
      }
      
      if (!token) {
        console.error("Aucun token d'authentification trouvÈ");
        throw new Error('Authentication required. Please log in again.');
      }

      console.log("Token utilisÈ pour les requÍtes API:", token.substring(0, 10) + "...");

      // RÈcupÈrer les donnÈes du cours
      const response = await fetch(`${config.API_URL}/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        credentials: 'include' // Include cookies in the request
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response from course API:", errorText);
        throw new Error('Failed to fetch course data');
      }

      const data = await response.json();
      console.log("Course data received:", data);
      setCourse(data);

      // RÈcupÈrer les vidÈos du cours
      const videosResponse = await fetch(`${config.API_URL}/api/videos/course/${courseId}`, {
        headers: {
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include' // Inclure les cookies dans la requÍte
      });

      if (videosResponse.ok) {
        const videosData = await videosResponse.json();
        console.log("VidÈos rÈcupÈrÈes du serveur:", videosData);

        // Format video URLs to include the full server URL
        const formattedVideos = videosData.map(video => {
          const formattedVideo = {
            ...video,
            videoUrl: video.videoUrl ? `${config.API_URL}${video.videoUrl}` : null
          };
          console.log("URL de vidÈo formatÈe:", formattedVideo.videoUrl);
          return formattedVideo;
        });

        setVideos(formattedVideos);
        if (formattedVideos.length > 0) {
          console.log("VidÈo sÈlectionnÈe:", formattedVideos[0]);
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
                console.warn(`Impossible de rÈcupÈrer le quiz ${quizId}:`, res.status);
                return null;
              }
              const quizData = await res.json();
              console.log(`Quiz ${quizId} data:`, quizData);

              // RÈcupÈrer les rÈsultats du quiz pour l'utilisateur actuel
              const resultsResponse = await fetch(`${config.API_URL}/api/quiz/results/${quizId}`, {
                headers: {
                  'Accept': 'application/json',
                  ...(token && { 'Authorization': `Bearer ${token}` })
                },
                credentials: 'include'
              });

              let completed = false;
              let lastScore = null;
              let hasCertificate = false;

              if (resultsResponse.ok) {
                const results = await resultsResponse.json();
                completed = results.length > 0;

                // RÈcupÈrer le dernier score si disponible
                if (results.length > 0) {
                  // Trier les rÈsultats par date (du plus rÈcent au plus ancien)
                  const sortedResults = [...results].sort((a, b) =>
                    new Date(b.submittedAt) - new Date(a.submittedAt)
                  );

                  // Prendre le score le plus rÈcent
                  lastScore = sortedResults[0].percentage;
                }

                // VÈrifier si l'utilisateur a dÈj‡ un certificat pour ce quiz
                if (quizData.isFinalQuiz) {
                  try {
                    const certificateResponse = await fetch(`${config.API_URL}/api/certificates/check/${quizId}`, {
                      headers: {
                        'Accept': 'application/json',
                        ...(token && { 'Authorization': `Bearer ${token}` })
                      },
                      credentials: 'include'
                    });

                    if (certificateResponse.ok) {
                      const certData = await certificateResponse.json();
                      hasCertificate = certData.hasCertificate;
                    }
                  } catch (error) {
                    console.warn(`Erreur lors de la vÈrification du certificat pour le quiz ${quizId}:`, error);
                  }
                }
              }

              return {
                ...quizData,
                _id: quizId,
                title: quizData.title || quizData.nom || 'Quiz sans titre',
                duration: quizData.duration || quizData.duree || quizData.chronoVal || 0,
                isFinalQuiz: quizData.isFinalQuiz || false,
                completed,
                lastScore,
                hasCertificate
              };
            }).catch(error => {
              console.warn(`Erreur lors de la rÈcupÈration du quiz ${quizId}:`, error);
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
         setError('Erreur lors de la rÈcupÈration des quiz. Veuillez rafraÓchir la page.');
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
    if (!duration && duration !== 0) return 'DurÈe non dÈfinie';
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
          <Alert.Heading>Cours non trouvÈ</Alert.Heading>
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
              <FaPlay /> VidÈos
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
                            console.log('R√©ponse:', answer, 'Question:', question);
                          }}
                        />
                      )}
                    </div>
                    <div className="video-list">
                      <h3>Liste des vid√©os</h3>
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
                    <h3>Aucune vid√©o disponible</h3>
                    <p>Les vid√©os pour ce cours seront bient√¥t disponibles.</p>
                  </div>
                )}
              </div>
            )}

{activeTab === 'quiz' && (
              <div className="quiz-list">
                {quizzes && quizzes.length > 0 ? (
                  <>
                    {/* Afficher d'abord les quiz standards */}
                    {quizzes
                      .filter(quiz => !quiz.isFinalQuiz)
                      .map((quiz, index, array) => {
                        // V√©rifier si ce quiz est accessible
                        // Le premier quiz est toujours accessible
                        // Les autres quiz ne sont accessibles que si le quiz pr√©c√©dent a √©t√© compl√©t√© avec au moins 50% de score
                        const previousQuiz = index > 0 ? array[index - 1] : null;
                        const isAccessible = index === 0 ||
                          (previousQuiz && previousQuiz.completed && previousQuiz.lastScore >= 50);

                        return (
                          <div key={quiz._id} className={`quiz-card ${!isAccessible ? 'locked-quiz' : ''}`}>
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
                                  <span className={`completed-badge ${quiz.lastScore < 50 ? 'low-score' : ''}`}>
                                    ‚úì Compl√©t√© {quiz.lastScore ? <span>{quiz.lastScore}%</span> : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isAccessible ? (
                              <button
                                className="start-quiz-btn"
                                onClick={() => startQuiz(quiz._id)}
                              >
                                <FaPlay /> {quiz.completed ? 'Recommencer' : 'Commencer'}
                              </button>
                            ) : (
                              <button
                                className="start-quiz-btn disabled"
                                disabled
                                title="Compl√©tez le quiz pr√©c√©dent avec un score d'au moins 50% pour d√©bloquer ce quiz"
                              >
                                <FaLock /> Verrouill√©
                              </button>
                            )}
                          </div>
                        );
                      })}

                    {/* Afficher les quiz finaux seulement si tous les quiz standards sont compl√©t√©s avec au moins 50% */}
                    {quizzes
                      .filter(quiz => quiz.isFinalQuiz)
                      .map((quiz, index) => {
                        // V√©rifier si tous les quiz standards sont compl√©t√©s avec au moins 50%
                        const standardQuizzes = quizzes.filter(q => !q.isFinalQuiz);
                        const allStandardQuizzesCompleted = standardQuizzes.length > 0 &&
                          standardQuizzes.every(q => q.completed && q.lastScore >= 50);

                        // V√©rifier si l'utilisateur a d√©j√† un certificat pour ce quiz
                        const hasCertificate = quiz.hasCertificate;

                        return (
                          <div key={quiz._id} className={`quiz-card ${quiz.isFinalQuiz ? 'final-quiz' : ''}`}>
                            <div className="quiz-info">
                              <h3>{quiz.title}</h3>
                              <div className="quiz-meta">
                                <span className="final-quiz-badge">
                                  <FaTrophy />
                                  Quiz Final
                                </span>
                                <span>
                                  <FaClock />
                                  {formatDuration(quiz.duration)}
                                </span>
                                <span>
                                  <FaQuestionCircle />
                                  {quiz.Questions ? quiz.Questions.length : 0} questions
                                </span>
                                {quiz.completed && (
                                  <span className={`completed-badge ${quiz.lastScore < 50 ? 'low-score' : ''}`}>
                                    ‚úì Compl√©t√© {quiz.lastScore ? <span>{quiz.lastScore}%</span> : ''}
                                  </span>
                                )}
                                {hasCertificate && (
                                  <span className="certificate-badge">
                                    <FaTrophy /> Certificat obtenu
                                  </span>
                                )}
                              </div>
                            </div>
                            {!allStandardQuizzesCompleted ? (
                              <button
                                className="start-quiz-btn disabled"
                                disabled
                                title="Compl√©tez tous les quiz avec un score d'au moins 50% pour d√©bloquer le quiz final"
                              >
                                <FaLock /> Verrouill√©
                              </button>
                            ) : hasCertificate ? (
                              <button
                                className="start-quiz-btn certificate-btn"
                                onClick={() => navigate('/profile', { state: { activeTab: 'certificates' } })}
                                title="Vous avez d√©j√† obtenu un certificat pour ce quiz"
                              >
                                <FaTrophy /> Voir mon certificat
                              </button>
                            ) : (
                              <button
                                className="start-quiz-btn"
                                onClick={() => startQuiz(quiz._id)}
                              >
                                <FaPlay /> {quiz.completed ? 'Recommencer' : 'Commencer'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </>
                ) : (
                  <div className="no-quiz-message">
                    <FaQuestionCircle size={48} />
                    <h3>Aucun quiz disponible</h3>
                    <p>Les quiz pour ce cours seront bient√¥t disponibles.</p>
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
            <div className="stats-container">
              <div className="stat-item">
                <span className="stat-label">Niveau</span>
                <span className="stat-value stat-highlight">{course.niveau || 'Interm√©diaire'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Quiz compl√©t√©s</span>
                <span className="stat-value">{quizzes.filter(q => q.completed).length}/{quizzes.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseView;
