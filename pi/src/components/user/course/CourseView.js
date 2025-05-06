import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, ProgressBar, Badge, Alert, Spinner } from 'react-bootstrap';
import Cookies from 'js-cookie';
import ReactPlayer from 'react-player';
import { Modal } from 'react-bootstrap';
import './CourseView.css';

// Import dynamique de l'éditeur de code pour optimiser le chargement
const LanguageCodeEditor = lazy(() => import('../../courses/CodeEditor'));

const backendURL = "http://localhost:5000/api";

const CourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [activeCodeExample, setActiveCodeExample] = useState(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [user, setUser] = useState(null);
  const [videoQuizzes, setVideoQuizzes] = useState({});
  const [videoWatched, setVideoWatched] = useState([]); // Initialiser comme un tableau vide
  const [completedQuizzes, setCompletedQuizzes] = useState([]);
  const [playerState, setPlayerState] = useState(null);
  const playerRef = useRef(null);
  const [playerPlaying, setPlayerPlaying] = useState(true);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [playerError, setPlayerError] = useState(null);

  // Récupérer les informations de l'utilisateur à partir du cookie
  useEffect(() => {
    const userCookie = Cookies.get('user');
    if (userCookie) {
      try {
        const userData = JSON.parse(userCookie);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user cookie:', error);
      }
    }
  }, []);

  // Récupérer les détails du cours
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = Cookies.get('token');
        const response = await fetch(`${backendURL}/courses/details/${courseId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch course');
        }

        const data = await response.json();

        // Si les vidéos n'existent pas ou sont vides, créer des vidéos de test adaptées au sujet du cours
        if (!data.videos || data.videos.length === 0) {
          // Déterminer le sujet du cours en fonction du titre
          const courseTitle = data.title ? data.title.toLowerCase() : '';
          const courseDescription = data.description ? data.description.toLowerCase() : '';

          // Déterminer le type de cours en fonction du titre et de la description
          let courseType = 'general';

          if (courseTitle.includes('android') || courseDescription.includes('android')) {
            courseType = 'android';
          } else if (courseTitle.includes('javascript') || courseTitle.includes('js') ||
                    courseDescription.includes('javascript')) {
            courseType = 'javascript';
          } else if (courseTitle.includes('python') || courseDescription.includes('python')) {
            courseType = 'python';
          } else if (courseTitle.includes('html') || courseTitle.includes('css') ||
                    courseDescription.includes('html') || courseDescription.includes('css')) {
            courseType = 'html';
          } else if (courseTitle.includes('react') || courseDescription.includes('react')) {
            courseType = 'react';
          }

          // Définir les vidéos en fonction du type de cours
          let demoVideos = [];

          switch(courseType) {
            case 'android':
              demoVideos = [
                {
                  _id: `video-android-1-${Date.now()}`,
                  title: 'Introduction au développement Android',
                  description: 'Découvrez les bases du développement Android et son écosystème',
                  url: 'https://www.youtube.com/watch?v=fis26HvvDII',
                  duration: 1020 // 17 minutes
                },
                {
                  _id: `video-android-2-${Date.now()}`,
                  title: 'Créer sa première app Android',
                  description: 'Apprendre à créer une application Android de A à Z',
                  url: 'https://www.youtube.com/watch?v=tZvjSl9dswg',
                  duration: 1260 // 21 minutes
                }
              ];
              break;

            case 'javascript':
              demoVideos = [
                {
                  _id: `video-js-1-${Date.now()}`,
                  title: 'Introduction à JavaScript',
                  description: 'Les fondamentaux de JavaScript pour le développement web',
                  url: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
                  duration: 900 // 15 minutes
                },
                {
                  _id: `video-js-2-${Date.now()}`,
                  title: 'JavaScript moderne - ES6+',
                  description: 'Découvrez les fonctionnalités avancées de JavaScript',
                  url: 'https://www.youtube.com/watch?v=NCwa_xi0Uuc',
                  duration: 1500 // 25 minutes
                }
              ];
              break;

            case 'python':
              demoVideos = [
                {
                  _id: `video-python-1-${Date.now()}`,
                  title: 'Introduction à Python',
                  description: 'Apprendre les bases de la programmation avec Python',
                  url: 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
                  duration: 1800 // 30 minutes
                },
                {
                  _id: `video-python-2-${Date.now()}`,
                  title: 'Programmation orientée objet en Python',
                  description: 'Comprendre les classes et objets en Python',
                  url: 'https://www.youtube.com/watch?v=ZDa-Z5JzLYM',
                  duration: 960 // 16 minutes
                }
              ];
              break;

            case 'react':
              demoVideos = [
                {
                  _id: `video-react-1-${Date.now()}`,
                  title: 'Introduction à React',
                  description: 'Comprendre les fondamentaux de React.js',
                  url: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
                  duration: 1200 // 20 minutes
                },
                {
                  _id: `video-react-2-${Date.now()}`,
                  title: 'États et props dans React',
                  description: 'Gérer les données et les événements dans React',
                  url: 'https://www.youtube.com/watch?v=4ORZ1GmjaMc',
                  duration: 900 // 15 minutes
                }
              ];
              break;

            case 'html':
            default:
              demoVideos = [
                {
                  _id: `video-html-1-${Date.now()}`,
                  title: 'Introduction à HTML et CSS',
                  description: 'Apprenez les bases du HTML et CSS pour créer des sites web modernes',
                  url: 'https://www.youtube.com/watch?v=qz0aGYrrlhU',
                  duration: 840 // 14 minutes
                },
                {
                  _id: `video-html-2-${Date.now()}`,
                  title: 'Le modèle de boîte (Box Model) en CSS',
                  description: 'Comprendre comment fonctionne le modèle de boîte en CSS',
                  url: 'https://www.youtube.com/watch?v=rIO5326FgPE',
                  duration: 600 // 10 minutes
                }
              ];
          }

          data.videos = demoVideos;
        }

        // S'assurer que chaque vidéo a une URL valide pour ReactPlayer
        data.videos = data.videos.map(video => ({
          ...video,
          url: video.url || video.videoUrl // Utiliser url ou videoUrl selon ce qui est disponible
        }));

        console.log('Course data:', data);
        setCourse(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching course:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  // Récupérer les quiz pour chaque vidéo du cours
  useEffect(() => {
    const fetchVideoQuizzes = async () => {
      if (!course || !course.videos || !course.videos.length) return;

      try {
        const token = Cookies.get('token');
        const quizzesByVideo = {};

        // Traiter chaque vidéo
        for (const video of course.videos) {
          // Vérifier si l'ID de la vidéo semble être un ObjectId valide de MongoDB
          // Les ObjectId de MongoDB sont des chaînes de 24 caractères hexadécimaux
          const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(video._id);

          if (isValidMongoId) {
            // Si c'est un ID MongoDB valide, faire la requête au backend
            try {
              const response = await fetch(`${backendURL}/videoquiz/video/${video._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (response.ok) {
                const quizData = await response.json();
                quizzesByVideo[video._id] = Array.isArray(quizData) ? quizData : [];
              } else {
                console.log(`No quizzes found for video ${video._id} or error occurred`);
                quizzesByVideo[video._id] = [];
              }
            } catch (error) {
              console.error(`Error fetching quizzes for video ${video._id}:`, error);
              quizzesByVideo[video._id] = [];
            }
          } else {
            // Si ce n'est pas un ID MongoDB valide (vidéo de démo), utiliser des données de démonstration
            console.log(`Using demo quizzes for video with non-MongoDB ID: ${video._id}`);
            quizzesByVideo[video._id] = [];
          }

          // Si pas de quiz disponible après les tentatives ci-dessus, créer des quiz de test
          if (!quizzesByVideo[video._id] || quizzesByVideo[video._id].length === 0) {
            quizzesByVideo[video._id] = [
              {
                _id: `quiz-${video._id}-1`,
                videoId: video._id,
                courseId: courseId,
                questions: [
                  {
                    _id: `question-${video._id}-1`,
                    question: 'Quelle balise HTML est utilisée pour définir un paragraphe?',
                    timeStamp: 30, // Apparaît après 30 secondes
                    options: [
                      { text: '<p>', isCorrect: true },
                      { text: '<paragraph>', isCorrect: false },
                      { text: '<text>', isCorrect: false },
                      { text: '<div>', isCorrect: false }
                    ]
                  },
                  {
                    _id: `question-${video._id}-2`,
                    question: 'Comment définir une couleur de fond en CSS?',
                    timeStamp: 90, // Apparaît après 1 minute 30
                    options: [
                      { text: 'color: red;', isCorrect: false },
                      { text: 'bg-color: red;', isCorrect: false },
                      { text: 'background-color: red;', isCorrect: true },
                      { text: 'background: red;', isCorrect: true }
                    ]
                  }
                ]
              }
            ];
          }
        }

        console.log('Video quizzes:', quizzesByVideo);
        setVideoQuizzes(quizzesByVideo);
      } catch (error) {
        console.error('Error in fetchVideoQuizzes:', error);
        // Initialiser avec un objet vide en cas d'erreur
        setVideoQuizzes({});
      }
    };

    fetchVideoQuizzes();
  }, [course, courseId]);

  // Récupérer la progression de l'utilisateur
  useEffect(() => {
    const fetchProgress = async () => {
      if (!course || !user) return;

      try {
        const token = Cookies.get('token');
        const response = await fetch(`${backendURL}/progress/user/${user._id}/course/${courseId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.videos) {
            // Assurer que data.videos est un tableau
            const progressArray = Array.isArray(data.videos) ? data.videos : [];
            setVideoWatched(progressArray);
          } else {
            setVideoWatched([]); // Initialiser avec un tableau vide si pas de données
          }

          // Récupérer les quiz complétés
          if (data && data.completedQuizzes) {
            setCompletedQuizzes(data.completedQuizzes);
          }
        } else {
          // Si pas de progression encore, initialiser avec un tableau vide
          setVideoWatched([]);
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
        setVideoWatched([]); // En cas d'erreur, initialiser avec un tableau vide
      }
    };

    fetchProgress();
  }, [course, user, courseId]);

  const checkForQuizzes = (progress) => {
    // Vérifications préliminaires
    if (!course || !course.videos || !videoQuizzes) return;

    const currentVideo = course.videos[activeVideoIndex];
    if (!currentVideo || !currentVideo._id) return;

    // Récupérer les quiz pour la vidéo actuelle avec une vérification supplémentaire
    const quizzesForVideo = videoQuizzes[currentVideo._id];

    // Vérifier que quizzesForVideo est un tableau
    if (!Array.isArray(quizzesForVideo) || quizzesForVideo.length === 0) {
      return; // Sortir de la fonction si pas de quiz ou pas un tableau
    }

    // Parcourir tous les quiz pour cette vidéo
    for (const quiz of quizzesForVideo) {
      // Vérifier que le quiz a un tableau de questions
      if (!quiz || !Array.isArray(quiz.questions)) continue;

      // Parcourir toutes les questions de ce quiz
      for (const question of quiz.questions) {
        // Vérifier que la question a un timestamp
        if (!question || typeof question.timeStamp !== 'number') continue;

        // Vérifier si le temps de la vidéo correspond à un temps de quiz
        if (Math.abs(progress - question.timeStamp) < 1 && playerPlaying) {
          setCurrentQuiz({
            id: question._id,
            videoId: currentVideo._id,
            question: question.question,
            options: question.options || [],
            timeStamp: question.timeStamp
          });

          // Mettre en pause la vidéo
          if (playerRef.current) {
            try {
              // Utiliser la méthode pauseVideo si disponible (pour YouTube)
              if (playerRef.current.getInternalPlayer &&
                  typeof playerRef.current.getInternalPlayer().pauseVideo === 'function') {
                playerRef.current.getInternalPlayer().pauseVideo();
              } else {
                // Fallback pour d'autres lecteurs
                playerRef.current.pause();
              }
              setPlayerPlaying(false);
            } catch (error) {
              console.error('Error pausing video:', error);
            }
          }

          setShowQuiz(true);
          return;
        }
      }
    }
  };

  const handleProgress = (state) => {
    setVideoProgress(state.playedSeconds);
    setPlayerState(state);
    checkForQuizzes(state.playedSeconds);
  };

  const handleQuizSubmit = async (selectedOption, isCorrect) => {
    if (!user || !currentQuiz) return;

    try {
      const token = Cookies.get('token');
      const response = await fetch(`${backendURL}/videoquiz/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user._id,
          videoId: currentQuiz.videoId,
          courseId: courseId,
          questionId: currentQuiz.id,
          selectedOption,
          isCorrect,
          videoProgress: videoProgress
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save quiz response');
      }

      // Ajouter la réponse à l'état local
      setQuizAnswers([...quizAnswers, {
        questionId: currentQuiz.id,
        question: currentQuiz.question,
        selectedOption,
        isCorrect
      }]);

      // Fermer le modal et reprendre la lecture
      setShowQuiz(false);

      // Reprendre la lecture de la vidéo
      if (playerRef.current) {
        playerRef.current.getInternalPlayer().playVideo();
        setPlayerPlaying(true);
      }

    } catch (error) {
      console.error('Error saving quiz response:', error);
    }
  };

  const handleVideoSelect = (index) => {
    setActiveVideoIndex(index);
    setVideoProgress(0);
    setQuizAnswers([]); // Réinitialiser les réponses aux quiz pour la nouvelle vidéo
  };

  const getYouTubeId = (url) => {
    if (!url) return null;

    // Essayer d'extraire l'ID d'une URL YouTube
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handlePlayerError = (error) => {
    console.error('Player error:', error);
    setPlayerError(`Erreur de lecture: ${error.message || "Vérifiez l'URL de la vidéo"}`);
  };

  const handlePlayerReady = () => {
    setPlayerError(null);
  };

  // Calculer la progression globale sur le cours
  const calculateOverallProgress = () => {
    if (!course || !course.videos || course.videos.length === 0) return 0;

    // Vérifier que videoWatched est un tableau avant d'utiliser reduce
    if (!Array.isArray(videoWatched)) return 0;

    let totalDuration = course.videos.reduce((acc, video) => acc + (video.duration || 0), 0);
    let watchedDuration = 0;

    // Calculer la durée regardée seulement si videoWatched est un tableau et n'est pas vide
    if (Array.isArray(videoWatched) && videoWatched.length > 0) {
      watchedDuration = videoWatched.reduce((acc, item) => {
        // Vérifier que item a une propriété progress
        return acc + (item && typeof item.progress === 'number' ? item.progress : 0);
      }, 0);
    }

    if (totalDuration === 0) return 0;
    return Math.min(100, Math.round((watchedDuration / totalDuration) * 100));
  };

  const getQuizStatusBadge = (videoId) => {
    if (completedQuizzes.includes(videoId)) {
      return <Badge bg="success">Quiz complété</Badge>;
    }
    const quizzesForVideo = videoQuizzes[videoId] || [];
    if (quizzesForVideo.length > 0) {
      return <Badge bg="warning">Quiz disponible</Badge>;
    }
    return null;
  };

  if (loading) {
    return (
      <Container className="course-loading">
        <div className="spinner"></div>
        <p>Loading course details...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Card className="error-card">
          <Card.Body>
            <Card.Title className="text-danger">Error</Card.Title>
            <Card.Text>{error}</Card.Text>
            <Button variant="primary" onClick={() => navigate('/courses')}>
              Return to Course List
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container>
        <Card className="error-card">
          <Card.Body>
            <Card.Title>Course Not Found</Card.Title>
            <Card.Text>The course you're looking for doesn't exist or has been removed.</Card.Text>
            <Button variant="primary" onClick={() => navigate('/courses')}>
              Browse Courses
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid className="course-container">
      <Container>
        <Row className="course-header">
          <Col>
            <h1 className="course-title">{course.title}</h1>
            <p className="course-description">{course.description}</p>
            <div className="course-progress">
              <span>Progression globale: {calculateOverallProgress()}%</span>
              <ProgressBar now={calculateOverallProgress()} variant="success" />
            </div>
          </Col>
        </Row>

        <Row>
          <Col md={3}>
            <div className="course-sidebar">
              <div className="nav-buttons">
                <Button
                  variant={activeTab === 'content' ? 'primary' : 'outline-primary'}
                  className="nav-button"
                  onClick={() => setActiveTab('content')}
                >
                  Contenu du cours
                </Button>

                {/* Onglet Code Editor - affiché uniquement si le cours a des exemples de code */}
                {course.codeExamples && course.codeExamples.length > 0 && (
                  <Button
                    variant={activeTab === 'code' ? 'primary' : 'outline-primary'}
                    className="nav-button"
                    onClick={() => setActiveTab('code')}
                  >
                    Éditeur de code
                  </Button>
                )}

                {course.quiz && (
                  <Button
                    variant={activeTab === 'quiz' ? 'primary' : 'outline-primary'}
                    className="nav-button"
                    onClick={() => setActiveTab('quiz')}
                  >
                    Quiz final
                  </Button>
                )}
              </div>

              {course.videos && course.videos.length > 0 && activeTab === 'content' && (
                <div className="video-list">
                  <h5>Vidéos du cours</h5>
                  <ul className="list-unstyled">
                    {course.videos.map((video, index) => {
                      const progress = videoWatched.find(v => v.videoId === video._id);
                      const progressPercent = progress ? progress.percentage : 0;

                      return (
                        <li
                          key={video._id || index}
                          className={`video-list-item ${index === activeVideoIndex ? 'active' : ''}`}
                          onClick={() => handleVideoSelect(index)}
                        >
                          <div className="video-list-title">
                            <span>{index + 1}. {video.title || "Vidéo sans titre"}</span>
                            {getQuizStatusBadge(video._id)}
                          </div>
                          <ProgressBar
                            now={progressPercent}
                            variant={progressPercent >= 90 ? "success" : "info"}
                            className="video-progress-bar"
                          />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Liste des exemples de code si l'onglet code est actif */}
              {activeTab === 'code' && course.codeExamples && course.codeExamples.length > 0 && (
                <div className="code-examples-list">
                  <h5>Exemples de code</h5>
                  <ul className="list-unstyled">
                    {course.codeExamples.map((example, index) => (
                      <li
                        key={example._id || index}
                        className={`code-example-item ${example._id === activeCodeExample ? 'active' : ''}`}
                        onClick={() => setActiveCodeExample(example._id)}
                      >
                        <div className="code-example-title">
                          <span>{index + 1}. {example.title}</span>
                          {example.isExercise && <Badge bg="primary" className="ms-2">Exercice</Badge>}
                        </div>
                        <Badge bg="secondary">{example.language}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Col>

          <Col md={9} className="course-main">
            {activeTab === 'content' && (
              <>
                <Card className="content-card">
                  <Card.Body>
                    <Card.Title>Description du cours</Card.Title>
                    <div className="course-description">{course.description}</div>
                  </Card.Body>
                </Card>

                {course.videos && course.videos.length > 0 ? (
                  <div className="video-item">
                    <h4 className="video-title">{course.videos[activeVideoIndex]?.title || "Vidéo sans titre"}</h4>
                    {course.videos[activeVideoIndex]?.description &&
                      <p className="video-description">{course.videos[activeVideoIndex].description}</p>
                    }

                    {playerError && <Alert variant="warning">{playerError}</Alert>}

                    <div className="video-player-container">
                      <ReactPlayer
                        ref={playerRef}
                        url={course.videos[activeVideoIndex]?.url}
                        controls
                        width="100%"
                        height="450px"
                        playing={playerPlaying}
                        onProgress={handleProgress}
                        onPause={() => setPlayerPlaying(false)}
                        onPlay={() => setPlayerPlaying(true)}
                        onError={handlePlayerError}
                        onReady={handlePlayerReady}
                        config={{
                          youtube: {
                            playerVars: {
                              rel: 0, // Ne pas afficher de vidéos suggérées à la fin
                              showinfo: 0 // Ne pas afficher le titre et les actions sur la vidéo
                            }
                          }
                        }}
                      />
                    </div>

                    <div className="video-progress-info">
                      <span>Progression: {Math.floor(videoProgress / 60)}:{Math.floor(videoProgress % 60).toString().padStart(2, '0')}</span>
                      <ProgressBar
                        now={(videoProgress / (course.videos[activeVideoIndex]?.duration || 1)) * 100}
                        variant="info"
                      />
                    </div>

                    {quizAnswers.length > 0 && (
                      <div className="quiz-summary">
                        <h5>Quiz répondus dans cette vidéo</h5>
                        <ul className="list-group">
                          {quizAnswers.map((answer, idx) => (
                            <li key={idx} className={`list-group-item ${answer.isCorrect ? 'list-group-item-success' : 'list-group-item-danger'}`}>
                              <div className="quiz-question">{answer.question}</div>
                              <div className="quiz-answer">
                                <strong>Votre réponse:</strong> {answer.selectedOption}
                                {answer.isCorrect ? ' ✓' : ' ✗'}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Modal show={showQuiz} onHide={() => {}} backdrop="static" centered>
                      <Modal.Header>
                        <Modal.Title>Question Interactive</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <h5>{currentQuiz?.question}</h5>
                        <div className="quiz-options">
                          {currentQuiz?.options?.map((option, idx) => (
                            <Button
                              key={idx}
                              variant="outline-primary"
                              className="quiz-option-btn mb-2"
                              onClick={() => handleQuizSubmit(option.text, option.isCorrect)}
                              block
                            >
                              {option.text}
                            </Button>
                          ))}
                        </div>
                      </Modal.Body>
                    </Modal>
                  </div>
                ) : (
                  <div className="no-content">No videos available for this course.</div>
                )}
              </>
            )}

            {/* Onglet Éditeur de Code */}
            {activeTab === 'code' && (
              <>
                {course.codeExamples && course.codeExamples.length > 0 ? (
                  <div className="code-editor-container">
                    {!activeCodeExample && course.codeExamples.length > 0 && (
                      // Si aucun exemple n'est sélectionné, sélectionner le premier automatiquement
                      <div className="text-center my-4">
                        <p>Sélectionnez un exemple de code dans la liste à gauche pour commencer.</p>
                        <Button
                          variant="primary"
                          onClick={() => setActiveCodeExample(course.codeExamples[0]._id)}
                        >
                          Commencer avec le premier exemple
                        </Button>
                      </div>
                    )}

                    {activeCodeExample && (
                      <Suspense fallback={<div className="text-center my-5"><Spinner animation="border" /></div>}>
                        {course.codeExamples.map(example => (
                          <div
                            key={example._id}
                            className={example._id === activeCodeExample ? 'd-block' : 'd-none'}
                          >
                            <Card className="mb-4">
                              <Card.Header>
                                <div className="d-flex justify-content-between align-items-center">
                                  <h4 className="mb-0">{example.title}</h4>
                                  {example.isExercise && (
                                    <Badge bg="primary">Exercice</Badge>
                                  )}
                                </div>
                              </Card.Header>
                              <Card.Body>
                                <p>{example.description}</p>

                                <LanguageCodeEditor
                                  language={example.language}
                                  initialCode={example.code}
                                  height="300px"
                                  readOnly={false}
                                  runnable={true}
                                  exerciseValidation={example.isExercise && example.solution
                                    ? (code) => {
                                        // Validation simple pour les exercices
                                        const normalizedCode = code.replace(/\s+/g, '').toLowerCase();
                                        const normalizedSolution = example.solution.replace(/\s+/g, '').toLowerCase();

                                        if (normalizedCode.includes(normalizedSolution)) {
                                          return { success: true, message: 'Bravo ! Votre solution est correcte.' };
                                        } else {
                                          return { success: false, message: 'Votre solution n\'est pas tout à fait correcte. Essayez encore ou consultez les indices.' };
                                        }
                                      }
                                    : null
                                  }
                                />

                                {/* Indices pour les exercices */}
                                {example.isExercise && example.hints && example.hints.length > 0 && (
                                  <div className="mt-3">
                                    <h5>Indices :</h5>
                                    <ul className="list-group">
                                      {example.hints.map((hint, idx) => (
                                        <li key={idx} className="list-group-item">{hint}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </Card.Body>
                            </Card>
                          </div>
                        ))}
                      </Suspense>
                    )}
                  </div>
                ) : (
                  <div className="no-content">
                    <Alert variant="info">
                      Ce cours ne contient pas encore d'exemples de code ou d'exercices.
                    </Alert>
                  </div>
                )}
              </>
            )}

            {/* Onglet Quiz */}
            {activeTab === 'quiz' && (
              <Card className="quiz-info-card">
                <Card.Body>
                  {course.quiz ? (
                    <div className="quiz-details">
                      <h4>{course.quiz.title}</h4>
                      <p>Number of questions: {course.quiz.questions?.length || 0}</p>
                      {course.quiz.chronoVal && (
                        <p>Time limit: {course.quiz.chronoVal} minutes</p>
                      )}
                      <Button
                        variant="primary"
                        className="start-quiz-btn"
                        onClick={() => navigate(`/courses/${courseId}/quiz/${course.quiz._id}`)}
                      >
                        Start Quiz
                      </Button>
                    </div>
                  ) : (
                    <div className="no-content">No quiz available for this course.</div>
                  )}
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </Container>
  );
};

export default CourseView;
