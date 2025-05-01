import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';  // Bootstrap from npm
import 'font-awesome/css/font-awesome.min.css';  // Font Awesome from npm
// Now import the CSS files that we've placed in src/assets/css
import './assets/css/imagehover.min.css';
import './assets/css/style.css';
import './assets/css/certificate-verification.css';
import './assets/css/modern-template.css';
import axios from 'axios';
import config from './config';
import { useNavigate } from 'react-router-dom';

const Template = () => {
  const navigate = useNavigate();
  const [certificateNumber, setCertificateNumber] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

            <div>

              {/*Modal box*/}
              <div className="modal fade" id="login" role="dialog">
                <div className="modal-dialog modal-sm">
                  {/* Modal content no 1*/}
                  <div className="modal-content">
                    <div className="modal-header">
                      <button type="button" className="close" data-dismiss="modal">×</button>
                      <h4 className="modal-title text-center form-title">Login</h4>
                    </div>
                    <div className="modal-body padtrbl">
                      <div className="login-box-body">
                        <p className="login-box-msg">Sign in to start your session</p>
                        <div className="form-group">
                          <form name id="loginForm">
                            <div className="form-group has-feedback">
                              {/*--- username ------------*/}
                              <input className="form-control" placeholder="Username" id="loginid" type="text" autoComplete="off" />
                              <span style={{display: 'none', fontWeight: 'bold', position: 'absolute', color: 'red', padding: '4px', fontSize: '11px', backgroundColor: 'rgba(128, 128, 128, 0.26)', zIndex: 17, right: '27px', top: '5px'}} id="span_loginid" />
                              {/*-Alredy exists  ! */}
                              <span className="glyphicon glyphicon-user form-control-feedback" />
                            </div>
                            <div className="form-group has-feedback">
                              {/*--- password ------------*/}
                              <input className="form-control" placeholder="Password" id="loginpsw" type="password" autoComplete="off" />
                              <span style={{display: 'none', fontWeight: 'bold', position: 'absolute', color: 'grey', padding: '4px', fontSize: '11px', backgroundColor: 'rgba(128, 128, 128, 0.26)', zIndex: 17, right: '27px', top: '5px'}} id="span_loginpsw" />
                              {/*-Alredy exists  ! */}
                              <span className="glyphicon glyphicon-lock form-control-feedback" />
                            </div>
                            <div className="row">
                              <div className="col-xs-12">
                                <div className="checkbox icheck">
                                  <label>
                                    <input type="checkbox" id="loginrem" /> Remember Me
                                  </label>
                                </div>
                              </div>
                              <div className="col-xs-12">
                                <button type="button" className="btn btn-green btn-block btn-flat" onClick="userlogin()">Sign In</button>
                              </div>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/*/ Modal box*/}
              {/*Banner*/}
              <div className="banner">
                <div className="banner-content">
                  <h1 className="banner-title">Formez-vous pour l'avenir</h1>
                  <p className="banner-subtitle">Découvrez nos formations de qualité et obtenez des certificats reconnus pour booster votre carrière</p>
                  <div className="banner-buttons">
                    <a href="#courses" className="btn btn-primary">Nos Cours</a>
                    <a href="#certificate-verification" className="btn btn-outline">Vérifier un Certificat</a>
                  </div>
                </div>
                <a href="#feature" className="scroll-down">
                  <i className="fa fa-chevron-down"></i>
                </a>
              </div>
              {/*/ Banner*/}
              {/*Feature*/}
              <section id="feature" className="section-padding">
                <div className="container">
                  <div className="row">
                    <div className="header-section text-center">
                      <h2>Nos Avantages</h2>
                      <p>Découvrez pourquoi nos formations sont reconnues pour leur qualité et leur efficacité</p>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-4">
                      <div className="feature-card">
                        <div className="feature-icon">
                          <i className="fa fa-laptop"></i>
                        </div>
                        <h3 className="feature-title">Formations à la pointe</h3>
                        <p className="feature-text">Nos cours sont constamment mis à jour pour intégrer les dernières technologies et méthodologies du marché.</p>
                      </div>
                    </div>
                    <div className="col-md-4 mb-4">
                      <div className="feature-card">
                        <div className="feature-icon">
                          <i className="fa fa-certificate"></i>
                        </div>
                        <h3 className="feature-title">Certificats Reconnus</h3>
                        <p className="feature-text">Obtenez des certificats vérifiables qui valorisent vos compétences auprès des employeurs.</p>
                      </div>
                    </div>
                    <div className="col-md-4 mb-4">
                      <div className="feature-card">
                        <div className="feature-icon">
                          <i className="fa fa-users"></i>
                        </div>
                        <h3 className="feature-title">Communauté Active</h3>
                        <p className="feature-text">Rejoignez une communauté d'apprenants et d'experts pour échanger et progresser ensemble.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              {/*/ feature*/}
              {/*Organisations*/}
              <section id="organisations" className="section-padding">
                <div className="container">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="col-lg-4 col-md-4 col-sm-4 col-xs-4">
                        <div className="orga-stru">
                          <h3>65%</h3>
                          <p>Say NO!!</p>
                          <i className="fa fa-male" />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-4 col-sm-4 col-xs-4">
                        <div className="orga-stru">
                          <h3>20%</h3>
                          <p>Says Yes!!</p>
                          <i className="fa fa-male" />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-4 col-sm-4 col-xs-4">
                        <div className="orga-stru">
                          <h3>15%</h3>
                          <p>Can't Say!!</p>
                          <i className="fa fa-male" />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="detail-info">
                        <hgroup>
                          <h3 className="det-txt"> Is inclusive quality education affordable?</h3>
                          <h4 className="sm-txt">(Revised and Updated for 2016)</h4>
                        </hgroup>
                        <p className="det-p">Donec et lectus bibendum dolor dictum auctor in ac erat. Vestibulum egestas sollicitudin metus non urna in eros tincidunt convallis id id nisi in interdum.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              {/*/ Organisations*/}
              {/*Cta*/}
              <section id="cta-2">
                <div className="container">
                  <div className="row">
                    <div className="col-lg-12">
                      <h2 className="text-center">Subscribe Now</h2>
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
                      <h2>Upcoming Workshop</h2>
                      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Exercitationem nesciunt vitae,<br /> maiores, magni dolorum aliquam.</p>
                      <hr className="bottom-line" />
                    </div>
                    <div className="col-md-4 col-sm-6">
                      <div className="service-box text-center">
                        <div className="icon-box">
                          <i className="fa fa-html5 color-green" />
                        </div>
                        <div className="icon-text">
                          <h4 className="ser-text">Mentor HTML5 Workshop</h4>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 col-sm-6">
                      <div className="service-box text-center">
                        <div className="icon-box">
                          <i className="fa fa-css3 color-green" />
                        </div>
                        <div className="icon-text">
                          <h4 className="ser-text">Mentor CSS3 Workshop</h4>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 col-sm-6">
                      <div className="service-box text-center">
                        <div className="icon-box">
                          <i className="fa fa-joomla color-green" />
                        </div>
                        <div className="icon-text">
                          <h4 className="ser-text">Mentor Joomla Workshop</h4>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              {/*/ work-shop*/}
              {/*Faculity member*/}
              <section id="faculity-member" className="section-padding">
                <div className="container">
                  <div className="row">
                    <div className="header-section text-center">
                      <h2>Meet Our Faculty Member</h2>
                      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Exercitationem nesciunt vitae,<br /> maiores, magni dolorum aliquam.</p>
                      <hr className="bottom-line" />
                    </div>
                    <div className="col-lg-4 col-md-4 col-sm-4">
                      <div className="pm-staff-profile-container">
                        <div className="pm-staff-profile-image-wrapper text-center">
                          <div className="pm-staff-profile-image">
                            <img src="/src/assets/img/mentor.jpg" alt="" className="img-thumbnail img-circle" />
                          </div>
                        </div>
                        <div className="pm-staff-profile-details text-center">
                          <p className="pm-staff-profile-name">Bryan Johnson</p>
                          <p className="pm-staff-profile-title">Lead Software Engineer</p>
                          <p className="pm-staff-profile-bio">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec et placerat dui. In posuere metus et elit placerat tristique. Maecenas eu est in sem ullamcorper tincidunt. </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-4 col-sm-4">
                      <div className="pm-staff-profile-container">
                        <div className="pm-staff-profile-image-wrapper text-center">
                          <div className="pm-staff-profile-image">
                            <img src="/src/assets/img/mentor.jpg" alt="" className="img-thumbnail img-circle" />
                          </div>
                        </div>
                        <div className="pm-staff-profile-details text-center">
                          <p className="pm-staff-profile-name">Bryan Johnson</p>
                          <p className="pm-staff-profile-title">Lead Software Engineer</p>
                          <p className="pm-staff-profile-bio">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec et placerat dui. In posuere metus et elit placerat tristique. Maecenas eu est in sem ullamcorper tincidunt. </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-4 col-sm-4">
                      <div className="pm-staff-profile-container">
                        <div className="pm-staff-profile-image-wrapper text-center">
                          <div className="pm-staff-profile-image">
                            <img src="/src/assets/img/mentor.jpg" alt="" className="img-thumbnail img-circle" />
                          </div>
                        </div>
                        <div className="pm-staff-profile-details text-center">
                          <p className="pm-staff-profile-name">Bryan Johnson</p>
                          <p className="pm-staff-profile-title">Lead Software Engineer</p>
                          <p className="pm-staff-profile-bio">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec et placerat dui. In posuere metus et elit placerat tristique. Maecenas eu est in sem ullamcorper tincidunt. </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              {/*/ Faculity member*/}
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
                      <h2>Our Pricing</h2>
                      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Exercitationem nesciunt vitae,<br /> maiores, magni dolorum aliquam.</p>
                      <hr className="bottom-line" />
                    </div>
                    <div className="col-md-4 col-sm-4">
                      <div className="price-table">
                        {/* Plan  */}
                        <div className="pricing-head">
                          <h4>Monthly Plan</h4>
                          <span className="fa fa-usd curency" /> <span className="amount">200</span>
                        </div>
                        {/* Plean Detail */}
                        <div className="price-in mart-15">
                          <a href="#" className="btn btn-bg green btn-block">PURCHACE</a>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 col-sm-4">
                      <div className="price-table">
                        {/* Plan  */}
                        <div className="pricing-head">
                          <h4>Quarterly Plan</h4>
                          <span className="fa fa-usd curency" /> <span className="amount">800</span>
                        </div>
                        {/* Plean Detail */}
                        <div className="price-in mart-15">
                          <a href="#" className="btn btn-bg yellow btn-block">PURCHACE</a>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 col-sm-4">
                      <div className="price-table">
                        {/* Plan  */}
                        <div className="pricing-head">
                          <h4>Year Plan</h4>
                          <span className="fa fa-usd curency" /> <span className="amount">1200</span>
                        </div>
                        {/* Plean Detail */}
                        <div className="price-in mart-15">
                          <a href="#" className="btn btn-bg red btn-block">PURCHACE</a>
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
                      <h2>Contact Us</h2>
                      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Exercitationem nesciunt vitae,<br /> maiores, magni dolorum aliquam.</p>
                      <hr className="bottom-line" />
                    </div>
                    <div id="sendmessage">Your message has been sent. Thank you!</div>
                    <div id="errormessage" />
                    <form action method="post" role="form" className="contactForm">
                      <div className="col-md-6 col-sm-6 col-xs-12 left">
                        <div className="form-group">
                          <input type="text" name="name" className="form-control form" id="name" placeholder="Your Name" data-rule="minlen:4" data-msg="Please enter at least 4 chars" />
                          <div className="validation" />
                        </div>
                        <div className="form-group">
                          <input type="email" className="form-control" name="email" id="email" placeholder="Your Email" data-rule="email" data-msg="Please enter a valid email" />
                          <div className="validation" />
                        </div>
                        <div className="form-group">
                          <input type="text" className="form-control" name="subject" id="subject" placeholder="Subject" data-rule="minlen:4" data-msg="Please enter at least 8 chars of subject" />
                          <div className="validation" />
                        </div>
                      </div>
                      <div className="col-md-6 col-sm-6 col-xs-12 right">
                        <div className="form-group">
                          <textarea className="form-control" name="message" rows={5} data-rule="required" data-msg="Please write something for us" placeholder="Message" defaultValue={""} />
                          <div className="validation" />
                        </div>
                      </div>
                      <div className="col-xs-12">
                        {/* Button */}
                        <button type="submit" id="submit" name="submit" className="form contact-form-button light-form-button oswald light">SEND EMAIL</button>
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