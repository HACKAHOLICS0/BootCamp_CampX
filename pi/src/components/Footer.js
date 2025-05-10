// src/components/Footer.js
import React from "react";
import '../Navbar.css';
import '../assets/css/modern-footer.css';

export default function Footer() {
  return (
    <footer className="modern-footer">
      <div className="footer-top">
        <div className="container">
          <div className="row">
            <div className="col-lg-4 col-md-6 mb-4">
              <div className="footer-widget">
                <h4 className="footer-title">À propos de nous</h4>
                <p className="footer-text">
                  Notre plateforme de formation en ligne propose des cours de qualité pour développer vos compétences et booster votre carrière professionnelle.
                </p>
                <div className="footer-social">
                  <a href="#" className="social-icon"><i className="fa fa-facebook"></i></a>
                  <a href="#" className="social-icon"><i className="fa fa-twitter"></i></a>
                  <a href="#" className="social-icon"><i className="fa fa-linkedin"></i></a>
                  <a href="#" className="social-icon"><i className="fa fa-instagram"></i></a>
                </div>
              </div>
            </div>

            <div className="col-lg-3 col-md-6 mb-4">
              <div className="footer-widget">
                <h4 className="footer-title">Liens rapides</h4>
                <ul className="footer-links">
                  <li><a href="/categories">Nos cours</a></li>
                  <li><a href="/verify-certificate">Vérifier un certificat</a></li>
                  <li><a href="/profile">Mon profil</a></li>
                  <li><a href="/contact">Contact</a></li>
                </ul>
              </div>
            </div>

            <div className="col-lg-5 col-md-12">
              <div className="footer-widget">
                <h4 className="footer-title">Restez informé</h4>
                <p className="footer-text">Inscrivez-vous à notre newsletter pour recevoir les dernières actualités et offres spéciales</p>
                <form className="footer-newsletter">
                  <div className="input-group">
                    <input type="email" className="form-control" placeholder="Votre adresse email" required />
                    <div className="input-group-append">
                      <button className="btn btn-primary" type="submit">S'inscrire</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <p className="copyright">© 2023 Plateforme de Formation. Tous droits réservés.</p>
            </div>
            <div className="col-md-6">
              <div className="footer-bottom-links text-md-right">
                <a href="#">Conditions d'utilisation</a>
                <a href="#">Politique de confidentialité</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

