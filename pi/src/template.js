import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';  // Bootstrap from npm
import 'font-awesome/css/font-awesome.min.css';  // Font Awesome from npm
// Now import the CSS files that we've placed in src/assets/css
import './assets/css/imagehover.min.css';
// import './assets/css/style.css';
import './assets/css/certificate-verification.css';
import './assets/css/modern-template.css';
import './assets/css/trainer-carousel.css';  // Import trainer carousel styles
import axios from 'axios';
import config from './config';
import { useNavigate } from 'react-router-dom';

const Template = () => {
  const navigate = useNavigate();
  const [certificateNumber, setCertificateNumber] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize carousel when component mounts
  useEffect(() => {
    // Check if the carousel element exists
    const trainersCarousel = document.getElementById('trainersCarousel');
    if (trainersCarousel && window.bootstrap) {
      // Initialize the Bootstrap carousel
      new window.bootstrap.Carousel(trainersCarousel, {
        interval: 5000, // Change slides every 5 seconds
        wrap: true,     // Continuous loop
        touch: true     // Enable touch swiping on mobile
      });
    }
  }, []);

  // Fonction pour vérifier un certificat
  const verifyCertificate = async (e) => {
    e.preventDefault();
    if (!certificateNumber.trim()) {
      setError('Veuillez entrer un numéro de certificat');
      return;
    }

    setLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      const response = await axios.get(`${config.API_URL}/api/certificates/verify/${certificateNumber.trim()}`);
      setVerificationResult(response.data);
    } catch (err) {
      console.error('Erreur lors de la vérification du certificat:', err);
      setError(err.response?.data?.error || 'Erreur lors de la vérification du certificat');
    } finally {
      setLoading(false);
    }
  };

  // Formater les dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Rediriger vers la page de vérification complète
  const goToFullVerification = () => {
    navigate('/verify-certificate');
  };

  return (
            <div className="modern-template">
              {/* Suppression de la modal box obsolète */}
              {/* Bannière principale modernisée */}
              <section className="hero-banner">
                <div className="container">
                  <div className="row align-items-center">
                    <div className="col-lg-6">
                      <h1 className="hero-title">Formez-vous pour <span className="text-gradient">l'avenir</span></h1>
                      <p className="hero-subtitle">Découvrez nos formations de qualité et obtenez des certificats reconnus pour booster votre carrière professionnelle</p>
                      <div className="hero-buttons">
                        <a href="#courses" className="btn btn-primary">Découvrir nos cours</a>
                        <a href="#certificate-verification" className="btn btn-outline">Vérifier un certificat</a>
                      </div>
                      <div className="hero-stats">
                        <div className="stat-item">
                          <span className="stat-number">1000+</span>
                          <span className="stat-text">Étudiants</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-number">50+</span>
                          <span className="stat-text">Cours</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-number">95%</span>
                          <span className="stat-text">Satisfaction</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="hero-image">
                        <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" alt="Étudiants en formation" className="img-fluid" />
                      </div>
                    </div>
                  </div>
                </div>
                <a href="#feature" className="scroll-down">
                  <i className="fa fa-chevron-down"></i>
                </a>
              </section>
              {/* Fin de la bannière */}
              {/* Section des avantages modernisée */}
              <section id="feature" className="features-section section-padding">
                <div className="container">
                  <div className="row">
                    <div className="col-12">
                      <div className="section-title text-center">
                        <span className="subtitle">Pourquoi nous choisir</span>
                        <h2>Nos <span className="text-gradient">Avantages</span></h2>
                        <p className="section-description">Découvrez pourquoi nos formations sont reconnues pour leur qualité et leur efficacité</p>
                      </div>
                    </div>
                  </div>

                  <div className="row mt-5">
                    <div className="col-md-4 mb-4">
                      <div className="feature-card">
                        <div className="feature-icon">
                          <i className="fa fa-laptop"></i>
                        </div>
                        <div className="feature-content">
                          <h3 className="feature-title">Formations à la pointe</h3>
                          <p className="feature-text">Nos cours sont constamment mis à jour pour intégrer les dernières technologies et méthodologies du marché.</p>
                          <a href="#courses" className="feature-link">En savoir plus <i className="fa fa-arrow-right"></i></a>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4 mb-4">
                      <div className="feature-card">
                        <div className="feature-icon">
                          <i className="fa fa-certificate"></i>
                        </div>
                        <div className="feature-content">
                          <h3 className="feature-title">Certificats Reconnus</h3>
                          <p className="feature-text">Obtenez des certificats vérifiables qui valorisent vos compétences auprès des employeurs.</p>
                          <a href="#certificate-verification" className="feature-link">Vérifier un certificat <i className="fa fa-arrow-right"></i></a>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4 mb-4">
                      <div className="feature-card">
                        <div className="feature-icon">
                          <i className="fa fa-users"></i>
                        </div>
                        <div className="feature-content">
                          <h3 className="feature-title">Communauté Active</h3>
                          <p className="feature-text">Rejoignez une communauté d'apprenants et d'experts pour échanger et progresser ensemble.</p>
                          <a href="#" className="feature-link">Rejoindre la communauté <i className="fa fa-arrow-right"></i></a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              {/* Fin de la section des avantages */}
              {/*Cta*/}
              <section id="cta-2">
                <div className="container">
                  <div className="row">
                    <div className="col-lg-12">
                      <h2 className="text-center">Abonnez-vous maintenant</h2>
                      <p className="cta-2-txt">Sign up for our free weekly software design courses, we’ll send them right to your inbox.</p>
                      <div className="cta-2-form text-center">
                        <form action="#" method="post" id="workshop-newsletter-form">
                          <input name placeholder="Enter Your Email Address" type="email" />
                          <input className="cta-2-form-submit-btn" defaultValue="Subscribe" type="submit" />
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              {/*/ Cta*/}

              {/*Certificate Verification*/}
              <section id="certificate-verification" className="certificate-section">
                <div className="container">
                  <div className="row">
                    <div className="header-section text-center">
                      <h2>Vérification de Certificat</h2>
                      <p>Vérifiez l'authenticité d'un certificat en entrant son numéro unique ci-dessous</p>
                    </div>
                    <div className="col-md-8 offset-md-2 col-sm-12">
                      <div className="certificate-verification-box">
                        <form onSubmit={verifyCertificate}>
                          <div className="input-group">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Entrez le numéro de certificat (ex: CERT-12345678-9012)"
                              value={certificateNumber}
                              onChange={(e) => setCertificateNumber(e.target.value)}
                              required
                            />
                            <div className="input-group-append">
                              <button
                                className="btn"
                                type="submit"
                                disabled={loading}
                              >
                                {loading ? (
                                  <><i className="fa fa-spinner fa-spin mr-2"></i> Vérification...</>
                                ) : (
                                  <><i className="fa fa-search mr-2"></i> Vérifier</>
                                )}
                              </button>
                            </div>
                          </div>
                        </form>

                        {error && (
                          <div className="alert alert-danger mt-3">
                            <i className="fa fa-exclamation-circle mr-2"></i>
                            <strong>Erreur:</strong> {error}
                          </div>
                        )}

                        {verificationResult && (
                          <div className={`certificate-result ${verificationResult.valid ? 'valid' : 'invalid'}`}>
                            <div className="result-header">
                              <i className={`fa ${verificationResult.valid ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                              <h3>
                                {verificationResult.valid
                                  ? 'Certificat Valide'
                                  : `Certificat ${verificationResult.status === 'expired' ? 'Expiré' : 'Invalide'}`}
                              </h3>
                            </div>

                            {verificationResult.certificate && (
                              <div className="certificate-details">
                                <div className="detail-item">
                                  <span className="label">Numéro:</span>
                                  <span className="value">{verificationResult.certificate.number}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="label">Délivré à:</span>
                                  <span className="value">{verificationResult.certificate.userName}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="label">Module:</span>
                                  <span className="value">{verificationResult.certificate.moduleName}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="label">Cours:</span>
                                  <span className="value">{verificationResult.certificate.courseName}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="label">Date d'émission:</span>
                                  <span className="value">{formatDate(verificationResult.certificate.issueDate)}</span>
                                </div>
                                {verificationResult.certificate.expiryDate && (
                                  <div className="detail-item">
                                    <span className="label">Date d'expiration:</span>
                                    <span className="value">{formatDate(verificationResult.certificate.expiryDate)}</span>
                                  </div>
                                )}
                                <div className="detail-item">
                                  <span className="label">Statut:</span>
                                  <span className={`value status-${verificationResult.status}`}>
                                    {verificationResult.status === 'active' ? 'Actif' : verificationResult.status === 'expired' ? 'Expiré' : 'Révoqué'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="text-center mt-3">
                          <button className="btn btn-outline" onClick={goToFullVerification}>
                            <i className="fa fa-external-link mr-2"></i> Accéder à la page de vérification complète
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              {/*/ Certificate Verification*/}

              {/*work-shop*/}
              <section id="work-shop" className="section-padding">
                <div className="container">
                  <div className="row">
                    <div className="header-section text-center">
                      <h2>Ateliers à venir</h2>
                      <p>Découvrez nos prochains ateliers pratiques pour développer vos compétences techniques et rester à jour avec les dernières technologies.</p>
                      <hr className="bottom-line" />
                    </div>
                    <div className="col-md-4 col-sm-6">
                      <div className="service-box text-center">
                        <div className="icon-box">
                          <i className="fa fa-html5 color-green" />
                        </div>
                        <div className="icon-text">
                          <h4 className="ser-text">Atelier HTML5 Avancé</h4>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 col-sm-6">
                      <div className="service-box text-center">
                        <div className="icon-box">
                          <i className="fa fa-css3 color-green" />
                        </div>
                        <div className="icon-text">
                          <h4 className="ser-text">Atelier CSS3 Créatif</h4>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 col-sm-6">
                      <div className="service-box text-center">
                        <div className="icon-box">
                          <i className="fa fa-joomla color-green" />
                        </div>
                        <div className="icon-text">
                          <h4 className="ser-text">Atelier Joomla Pratique</h4>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              {/*/ work-shop*/}
              {/*Trainers Carousel*/}
              <section id="faculity-member" className="section-padding">
                <div className="container">
                  <div className="row">
                    <div className="header-section text-center">
                      <h2>Rencontrez nos formateurs</h2>
                      <p>Découvrez notre équipe de formateurs experts qui vous accompagneront tout au long de votre parcours d'apprentissage.</p>
                      <hr className="bottom-line" />
                    </div>
                  </div>

                  <div className="trainer-carousel">
                    <div id="trainersCarousel" className="carousel slide" data-bs-ride="carousel">
                      <div className="carousel-indicators">
                        <button type="button" data-bs-target="#trainersCarousel" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
                        <button type="button" data-bs-target="#trainersCarousel" data-bs-slide-to="1" aria-label="Slide 2"></button>
                        <button type="button" data-bs-target="#trainersCarousel" data-bs-slide-to="2" aria-label="Slide 3"></button>
                      </div>

                      <div className="carousel-inner">
                        {/* First slide - 3 trainers */}
                        <div className="carousel-item active">
                          <div className="row">
                            <div className="col-md-4">
                              <div className="trainer-profile">
                                <div className="trainer-image">
                                  <img src="https://ui-avatars.com/api/?name=Ikram+Segni&background=5FCF80&color=fff&size=200" alt="Ikram Segni" />
                                </div>
                                <h3 className="trainer-name">Ikram Segni</h3>
                                <p className="trainer-title">Développeur Full Stack</p>
                                <p className="trainer-bio">Expert en développement web avec une solide expérience dans les technologies modernes. Passionné par la transmission de connaissances et l'accompagnement des apprenants.</p>
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="trainer-profile">
                                <div className="trainer-image">
                                  <img src="https://ui-avatars.com/api/?name=Achraf+Farhat&background=5FCF80&color=fff&size=200" alt="Achraf Farhat" />
                                </div>
                                <h3 className="trainer-name">Achraf Farhat</h3>
                                <p className="trainer-title">Expert en Intelligence Artificielle</p>
                                <p className="trainer-bio">Spécialiste en IA et machine learning avec une approche pédagogique claire et accessible. Aide les étudiants à maîtriser les concepts complexes de l'intelligence artificielle.</p>
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="trainer-profile">
                                <div className="trainer-image">
                                  <img src="https://ui-avatars.com/api/?name=Med+Firas+Zighni&background=5FCF80&color=fff&size=200" alt="Med Firas Zighni" />
                                </div>
                                <h3 className="trainer-name">Med Firas Zighni</h3>
                                <p className="trainer-title">Expert en Cybersécurité</p>
                                <p className="trainer-bio">Consultant en sécurité informatique avec une expertise reconnue dans la protection des systèmes et la gestion des risques. Formateur certifié avec une approche pratique.</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Second slide - 2 trainers */}
                        <div className="carousel-item">
                          <div className="row">
                            <div className="col-md-6">
                              <div className="trainer-profile">
                                <div className="trainer-image">
                                  <img src="https://ui-avatars.com/api/?name=Khalil+Wnich&background=5FCF80&color=fff&size=200" alt="Khalil Wnich" />
                                </div>
                                <h3 className="trainer-name">Khalil Wnich</h3>
                                <p className="trainer-title">Architecte Cloud</p>
                                <p className="trainer-bio">Expert en solutions cloud et infrastructure avec plus de 8 ans d'expérience. Aide les étudiants à comprendre et mettre en œuvre des architectures cloud robustes et évolutives.</p>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="trainer-profile">
                                <div className="trainer-image">
                                  <img src="https://ui-avatars.com/api/?name=Ahmed+Hmid&background=5FCF80&color=fff&size=200" alt="Ahmed Hmid" />
                                </div>
                                <h3 className="trainer-name">Ahmed Hmid</h3>
                                <p className="trainer-title">Expert en DevOps</p>
                                <p className="trainer-bio">Spécialiste en pratiques DevOps et automatisation des processus de développement. Passionné par l'optimisation des workflows et l'amélioration continue des processus de livraison.</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Third slide - All trainers in a different layout */}
                        <div className="carousel-item">
                          <div className="row">
                            <div className="col-md-12 text-center mb-4">
                              <h3>Notre équipe complète</h3>
                              <p>Une équipe d'experts passionnés par l'enseignement et le partage de connaissances</p>
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-md-2 col-sm-4 col-6">
                              <div className="trainer-image">
                                <img src="https://ui-avatars.com/api/?name=Ikram+Segni&background=5FCF80&color=fff&size=200" alt="Ikram Segni" />
                              </div>
                              <h5 className="trainer-name text-center mt-2">Ikram Segni</h5>
                            </div>
                            <div className="col-md-2 col-sm-4 col-6">
                              <div className="trainer-image">
                                <img src="https://ui-avatars.com/api/?name=Achraf+Farhat&background=5FCF80&color=fff&size=200" alt="Achraf Farhat" />
                              </div>
                              <h5 className="trainer-name text-center mt-2">Achraf Farhat</h5>
                            </div>
                            <div className="col-md-2 col-sm-4 col-6">
                              <div className="trainer-image">
                                <img src="https://ui-avatars.com/api/?name=Med+Firas+Zighni&background=5FCF80&color=fff&size=200" alt="Med Firas Zighni" />
                              </div>
                              <h5 className="trainer-name text-center mt-2">Med Firas Zighni</h5>
                            </div>
                            <div className="col-md-2 col-sm-4 col-6">
                              <div className="trainer-image">
                                <img src="https://ui-avatars.com/api/?name=Khalil+Wnich&background=5FCF80&color=fff&size=200" alt="Khalil Wnich" />
                              </div>
                              <h5 className="trainer-name text-center mt-2">Khalil Wnich</h5>
                            </div>
                            <div className="col-md-2 col-sm-4 col-6">
                              <div className="trainer-image">
                                <img src="https://ui-avatars.com/api/?name=Ahmed+Hmid&background=5FCF80&color=fff&size=200" alt="Ahmed Hmid" />
                              </div>
                              <h5 className="trainer-name text-center mt-2">Ahmed Hmid</h5>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button className="carousel-control-prev" type="button" data-bs-target="#trainersCarousel" data-bs-slide="prev">
                        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span className="visually-hidden">Previous</span>
                      </button>
                      <button className="carousel-control-next" type="button" data-bs-target="#trainersCarousel" data-bs-slide="next">
                        <span className="carousel-control-next-icon" aria-hidden="true"></span>
                        <span className="visually-hidden">Next</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
              {/*/ Trainers Carousel*/}
              {/*Testimonial*/}
              <section id="testimonial" className="testimonial-section section-padding">
                <div className="container">
                  <div className="row">
                    <div className="header-section text-center">
                      <h2 className="white">Ce que disent nos étudiants</h2>
                      <p className="white">Découvrez les témoignages de nos étudiants qui ont réussi grâce à nos formations</p>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-lg-4 col-md-6 mb-4">
                      <div className="testimonial-card">
                        <p className="testimonial-text">
                          "La formation en développement web a complètement transformé ma carrière. Les cours sont clairs, pratiques et le certificat m'a aidé à décrocher mon premier emploi dans le domaine."
                        </p>
                        <div className="testimonial-author">
                          <div className="testimonial-avatar">
                            <img src="https://randomuser.me/api/portraits/women/32.jpg" alt="Sophie Martin" />
                          </div>
                          <div className="testimonial-info">
                            <h4>Sophie Martin</h4>
                            <p>Développeuse Web</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6 mb-4">
                      <div className="testimonial-card">
                        <p className="testimonial-text">
                          "J'ai suivi la formation en Data Science et j'ai été impressionné par la qualité du contenu. Les projets pratiques m'ont permis d'acquérir une expérience concrète que j'ai pu valoriser auprès des recruteurs."
                        </p>
                        <div className="testimonial-author">
                          <div className="testimonial-avatar">
                            <img src="https://randomuser.me/api/portraits/men/44.jpg" alt="Thomas Dubois" />
                          </div>
                          <div className="testimonial-info">
                            <h4>Thomas Dubois</h4>
                            <p>Data Scientist</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6 mb-4">
                      <div className="testimonial-card">
                        <p className="testimonial-text">
                          "La certification en cybersécurité a été un véritable tremplin pour ma carrière. Le contenu est à jour avec les dernières tendances du secteur et les formateurs sont de véritables experts."
                        </p>
                        <div className="testimonial-author">
                          <div className="testimonial-avatar">
                            <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Léa Bernard" />
                          </div>
                          <div className="testimonial-info">
                            <h4>Léa Bernard</h4>
                            <p>Experte en Cybersécurité</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              {/*/ Testimonial*/}
              {/*Courses*/}
              <section id="courses" className="section-padding">
                <div className="container">
                  <div className="row">
                    <div className="header-section text-center">
                      <h2>Nos Formations</h2>
                      <p>Découvrez nos formations de qualité pour développer vos compétences et booster votre carrière</p>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-lg-4 col-md-6 mb-4">
                      <div className="course-card">
                        <div className="course-image">
                          <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" alt="Développement Web" />
                        </div>
                        <div className="course-content">
                          <h3 className="course-title">Développement Web Avancé</h3>
                          <div className="course-info">
                            <span><i className="fa fa-clock-o"></i> 12 semaines</span>
                            <span><i className="fa fa-user"></i> 24 étudiants</span>
                          </div>
                          <p className="course-description">Maîtrisez les technologies web modernes et développez des applications complètes.</p>
                          <div className="course-footer">
                            <span className="course-price">299 €</span>
                            <a href="#" className="btn btn-sm btn-outline">En savoir plus</a>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6 mb-4">
                      <div className="course-card">
                        <div className="course-image">
                          <img src="https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" alt="Data Science" />
                        </div>
                        <div className="course-content">
                          <h3 className="course-title">Data Science & IA</h3>
                          <div className="course-info">
                            <span><i className="fa fa-clock-o"></i> 10 semaines</span>
                            <span><i className="fa fa-user"></i> 18 étudiants</span>
                          </div>
                          <p className="course-description">Apprenez à analyser des données et à créer des modèles d'intelligence artificielle.</p>
                          <div className="course-footer">
                            <span className="course-price">349 €</span>
                            <a href="#" className="btn btn-sm btn-outline">En savoir plus</a>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6 mb-4">
                      <div className="course-card">
                        <div className="course-image">
                          <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" alt="Cybersécurité" />
                        </div>
                        <div className="course-content">
                          <h3 className="course-title">Cybersécurité</h3>
                          <div className="course-info">
                            <span><i className="fa fa-clock-o"></i> 8 semaines</span>
                            <span><i className="fa fa-user"></i> 15 étudiants</span>
                          </div>
                          <p className="course-description">Protégez les systèmes informatiques contre les menaces et les attaques.</p>
                          <div className="course-footer">
                            <span className="course-price">399 €</span>
                            <a href="#" className="btn btn-sm btn-outline">En savoir plus</a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-4">
                    <a href="/categories" className="btn btn-primary">Voir toutes nos formations</a>
                  </div>
                </div>
              </section>
              {/*/ Courses*/}
              {/*Pricing*/}
              <section id="pricing" className="section-padding">
                <div className="container">
                  <div className="row">
                    <div className="header-section text-center">
                      <h2>Nos tarifs</h2>
                      <p>Découvrez nos différentes formules d'abonnement adaptées à vos besoins et à votre budget pour accéder à l'ensemble de nos formations.</p>
                      <hr className="bottom-line" />
                    </div>
                    <div className="col-md-4 col-sm-4">
                      <div className="price-table">
                        {/* Plan  */}
                        <div className="pricing-head">
                          <h4>Forfait Mensuel</h4>
                          <span className="fa fa-eur curency" /> <span className="amount">200</span>
                        </div>
                        {/* Plean Detail */}
                        <div className="price-in mart-15">
                          <a href="#" className="btn btn-bg green btn-block">ACHETER</a>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 col-sm-4">
                      <div className="price-table">
                        {/* Plan  */}
                        <div className="pricing-head">
                          <h4>Forfait Trimestriel</h4>
                          <span className="fa fa-eur curency" /> <span className="amount">800</span>
                        </div>
                        {/* Plean Detail */}
                        <div className="price-in mart-15">
                          <a href="#" className="btn btn-bg yellow btn-block">ACHETER</a>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 col-sm-4">
                      <div className="price-table">
                        {/* Plan  */}
                        <div className="pricing-head">
                          <h4>Forfait Annuel</h4>
                          <span className="fa fa-eur curency" /> <span className="amount">1200</span>
                        </div>
                        {/* Plean Detail */}
                        <div className="price-in mart-15">
                          <a href="#" className="btn btn-bg red btn-block">ACHETER</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              {/*/ Pricing*/}
              {/*Contact*/}
              <section id="contact" className="section-padding">
                <div className="container">
                  <div className="row">
                    <div className="header-section text-center">
                      <h2>Contactez-nous</h2>
                      <p>Vous avez des questions ou besoin d'informations supplémentaires ? N'hésitez pas à nous contacter, notre équipe est à votre disposition.</p>
                      <hr className="bottom-line" />
                    </div>
                    <div id="sendmessage">Votre message a été envoyé. Merci !</div>
                    <div id="errormessage" />
                    <form action method="post" role="form" className="contactForm">
                      <div className="col-md-6 col-sm-6 col-xs-12 left">
                        <div className="form-group">
                          <input type="text" name="name" className="form-control form" id="name" placeholder="Votre nom" data-rule="minlen:4" data-msg="Veuillez entrer au moins 4 caractères" />
                          <div className="validation" />
                        </div>
                        <div className="form-group">
                          <input type="email" className="form-control" name="email" id="email" placeholder="Votre email" data-rule="email" data-msg="Veuillez entrer une adresse email valide" />
                          <div className="validation" />
                        </div>
                        <div className="form-group">
                          <input type="text" className="form-control" name="subject" id="subject" placeholder="Sujet" data-rule="minlen:4" data-msg="Veuillez entrer au moins 8 caractères pour le sujet" />
                          <div className="validation" />
                        </div>
                      </div>
                      <div className="col-md-6 col-sm-6 col-xs-12 right">
                        <div className="form-group">
                          <textarea className="form-control" name="message" rows={5} data-rule="required" data-msg="Veuillez écrire un message" placeholder="Message" defaultValue={""} />
                          <div className="validation" />
                        </div>
                      </div>
                      <div className="col-xs-12">
                        {/* Button */}
                        <button type="submit" id="submit" name="submit" className="form contact-form-button light-form-button oswald light">ENVOYER</button>
                      </div>
                    </form>
                  </div>
                </div>
              </section>
              {/*/ Contact*/}
            </div>










  );
};

export default Template;

