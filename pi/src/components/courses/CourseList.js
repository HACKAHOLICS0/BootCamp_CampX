import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import { FaUsers, FaClock, FaBook, FaGraduationCap, FaStar, FaChartLine, FaShoppingCart } from 'react-icons/fa';
import Cookies from 'js-cookie';
import PaymentForm from './PaymentForm';
import RecommendedVideos from './RecommendedVideos';
import './CourseStyle.css';

const backendURL = "http://localhost:5000/api";

const CourseList = () => {
  const { categoryId, moduleId } = useParams();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [userEnrolledCourses, setUserEnrolledCourses] = useState([]);

  useEffect(() => {
    fetchData();
    fetchUserEnrolledCourses();
  }, [moduleId]);

  // Effet pour vérifier les cours achetés après le chargement des cours
  useEffect(() => {
    if (courses.length > 0 && userEnrolledCourses.length > 0) {
      console.log("Vérification des cours achetés après chargement:");
      courses.forEach(course => {
        const courseIdStr = course._id.toString();
        const isEnrolled = userEnrolledCourses.includes(courseIdStr);
        console.log(`- Cours "${course.title}" (ID: ${courseIdStr}): ${isEnrolled ? 'Déjà acheté' : 'Non acheté'}`);
      });
    }
  }, [courses, userEnrolledCourses]);

  const fetchUserEnrolledCourses = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) return;

      const response = await fetch(`${backendURL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("Données utilisateur complètes:", userData);

        // Afficher la structure exacte des données pour le débogage
        if (userData.enrolledCourses) {
          console.log("Structure des cours achetés:", JSON.stringify(userData.enrolledCourses, null, 2));
        }

        // Extraire les IDs des cours achetés et les convertir en chaînes de caractères
        if (userData.enrolledCourses && Array.isArray(userData.enrolledCourses)) {
          // Récupérer les IDs des cours achetés
          const enrolledCourseIds = userData.enrolledCourses.map(course => {
            console.log("Traitement du cours:", course);

            // Vérifier si courseId est un objet ou une chaîne
            if (course.courseId && typeof course.courseId === 'object' && course.courseId._id) {
              console.log("courseId est un objet avec _id:", course.courseId._id);
              return course.courseId._id.toString();
            } else if (course.courseId) {
              console.log("courseId est une chaîne ou un autre type:", course.courseId);
              return course.courseId.toString();
            } else {
              console.log("courseId est null ou undefined");
              return null;
            }
          }).filter(id => id !== null); // Filtrer les valeurs null

          console.log("Cours achetés (IDs finaux):", enrolledCourseIds);
          setUserEnrolledCourses(enrolledCourseIds);
        } else {
          console.warn("Aucun cours acheté trouvé ou format inattendu:", userData.enrolledCourses);
          setUserEnrolledCourses([]);
        }
      } else {
        console.error("Erreur lors de la récupération des données utilisateur:", response.status);
      }
    } catch (error) {
      console.error('Failed to fetch user courses:', error);
      setUserEnrolledCourses([]);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = Cookies.get('token');

      if (!token) {
        throw new Error('Authentication required');
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      };

      const [coursesRes, moduleRes] = await Promise.all([
        fetch(`${backendURL}/courses/module/${moduleId}`, config),
        fetch(`${backendURL}/modules/${moduleId}`, config)
      ]);

      if (!coursesRes.ok || !moduleRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [coursesData, moduleData] = await Promise.all([
        coursesRes.json(),
        moduleRes.json()
      ]);

      setCourses(coursesData);
      setModule(moduleData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError(error.message || 'Failed to load courses');
      setLoading(false);
    }
  };

  const handlePurchaseClick = (course) => {
    // Vérifier si l'utilisateur a déjà acheté ce cours
    const courseIdStr = course._id.toString();
    console.log("Tentative d'achat du cours:", course.title);
    console.log("ID du cours:", courseIdStr);
    console.log("Liste des cours achetés:", userEnrolledCourses);

    // Utiliser une méthode plus robuste pour vérifier si le cours est acheté
    let isAlreadyPurchased = false;

    // Méthode 1: Vérifier si l'ID du cours est dans la liste des cours achetés
    if (userEnrolledCourses.includes(courseIdStr)) {
      isAlreadyPurchased = true;
    }

    // Méthode 2: Vérifier si l'ID du cours est dans la liste des cours achetés (comparaison manuelle)
    if (!isAlreadyPurchased) {
      for (const enrolledId of userEnrolledCourses) {
        if (enrolledId === courseIdStr) {
          isAlreadyPurchased = true;
          break;
        }
      }
    }

    // Méthode 3: Vérifier si le cours est dans la liste des cours achetés par son ID (comparaison partielle)
    if (!isAlreadyPurchased && courseIdStr && userEnrolledCourses.some(id => id && courseIdStr.includes(id))) {
      isAlreadyPurchased = true;
    }

    console.log("Le cours est-il déjà acheté?", isAlreadyPurchased);

    if (isAlreadyPurchased) {
      // Afficher un message d'alerte
      alert("Vous avez déjà acheté ce cours. Vous pouvez y accéder depuis votre profil ou en cliquant sur 'Accéder au cours'.");
      // Rediriger vers le cours
      navigateToCourse(course._id);
    } else {
      // Afficher le modal de paiement
      setSelectedCourse(course);
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    fetchUserEnrolledCourses(); // Refresh enrolled courses
    navigateToCourse(selectedCourse._id);
  };

  const navigateToCourse = (courseId) => {
    navigate(`/categories/${categoryId}/modules/${moduleId}/courses/${courseId}`);
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="course-header">
        <h2>{module?.name || 'Cours disponibles'}</h2>
        <p className="text-muted">
          {module?.description || 'Découvrez nos cours interactifs et enrichissants'}
        </p>
      </div>

      {courses.length === 0 ? (
        <Alert variant="info">
          <p className="mb-0">Aucun cours n'est disponible pour ce module.</p>
          <p className="mb-0">Revenez bientôt pour découvrir notre nouveau contenu !</p>
        </Alert>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {courses.map(course => {
            // Vérifier si le cours est dans la liste des cours achetés
            const courseIdStr = course._id.toString();

            // Utiliser une méthode plus robuste pour vérifier si le cours est acheté
            let isEnrolled = false;

            // Méthode 1: Vérifier si l'ID du cours est dans la liste des cours achetés
            if (userEnrolledCourses.includes(courseIdStr)) {
              isEnrolled = true;
            }

            // Méthode 2: Vérifier si l'ID du cours est dans la liste des cours achetés (comparaison manuelle)
            if (!isEnrolled) {
              for (const enrolledId of userEnrolledCourses) {
                if (enrolledId === courseIdStr) {
                  isEnrolled = true;
                  break;
                }
              }
            }

            // Méthode 3: Vérifier si le cours est dans la liste des cours achetés par son ID (comparaison partielle)
            if (!isEnrolled && courseIdStr && userEnrolledCourses.some(id => id && courseIdStr.includes(id))) {
              isEnrolled = true;
            }

            console.log(`Cours ${course.title} (ID: ${courseIdStr}): ${isEnrolled ? 'Déjà acheté' : 'Non acheté'}`);
            console.log(`Liste des cours achetés: ${userEnrolledCourses.join(', ')}`);

            return (
              <Col key={course._id}>
                <Card className="course-card">
                  <Card.Body>
                    <Card.Title>{course.title}</Card.Title>
                    <Card.Text>{course.description}</Card.Text>

                    <div className="course-meta">
                      <div className="course-stats-grid">
                        <div className="stat-item">
                          <div className="stat-icon">
                            <FaUsers />
                          </div>
                          <div className="stat-info">
                            <span className="stat-label">Participants</span>
                            <span className="stat-value">{course.purchasedBy?.length || 0}</span>
                          </div>
                        </div>

                        <div className="stat-item">
                          <div className="stat-icon">
                            <FaClock />
                          </div>
                          <div className="stat-info">
                            <span className="stat-label">Durée</span>
                            <span className="stat-value">{course.duration}h</span>
                          </div>
                        </div>

                        <div className="stat-item">
                          <div className="stat-icon">
                            <FaBook />
                          </div>
                          <div className="stat-info">
                            <span className="stat-label">Quiz</span>
                            <span className="stat-value">{course.quizzes?.length || 0}</span>
                          </div>
                        </div>

                        <div className="stat-item">
                          <div className="stat-icon">
                            <FaChartLine />
                          </div>
                          <div className="stat-info">
                            <span className="stat-label">Niveau</span>
                            <span className="stat-value">Intermédiaire</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="course-tags">
                      {course.quizzes?.length > 0 && (
                        <span className="course-tag">
                          <FaGraduationCap className="me-1" />
                          {course.quizzes.length} Quiz
                        </span>
                      )}
                      <span className="course-tag">
                        <FaStar className="me-1" />
                        Certifiant
                      </span>
                    </div>
                  </Card.Body>

                  <div className="course-footer">
                    {isEnrolled ? (
                      <div className="d-flex flex-column align-items-stretch w-100">
                        <div className="course-purchased-alert mb-2">
                          <FaShoppingCart className="me-1" />
                          Vous avez déjà acheté ce cours
                        </div>
                        <Button
                          variant="success"
                          onClick={() => navigateToCourse(course._id)}
                          className="w-100"
                        >
                          <FaBook className="me-2" />
                          Accéder au cours
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="course-price">
                          {course.price} DT
                        </div>
                        <Button
                          variant="primary"
                          onClick={() => handlePurchaseClick(course)}
                        >
                          <FaShoppingCart className="me-2" />
                          Acheter
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Paiement du cours</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCourse && (
            <div className="payment-course-info">
              <h4>{selectedCourse.title}</h4>
              <p className="text-muted">{selectedCourse.description}</p>

              {/* Vérifier si le cours est déjà acheté */}
              {userEnrolledCourses.includes(selectedCourse._id.toString()) ? (
                <div className="alert alert-info">
                  <h5>Cours déjà acheté</h5>
                  <p>Vous avez déjà acheté ce cours. Vous allez être redirigé vers la page du cours...</p>
                  {setTimeout(() => {
                    setShowPaymentModal(false);
                    navigateToCourse(selectedCourse._id);
                  }, 2000) && null}
                </div>
              ) : (
                <PaymentForm
                  courseId={selectedCourse._id}
                  amount={selectedCourse.price}
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => setShowPaymentModal(false)}
                />
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Section des vidéos recommandées */}
      <div className="recommended-videos-section mt-5">
        <RecommendedVideos
          category={module?.name}
          limit={3}
        />
      </div>
    </Container>
  );
};

export default CourseList;