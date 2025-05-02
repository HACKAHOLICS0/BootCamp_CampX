import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import GoogleLoginButton from "./GoogleLoginButton";
import ReCAPTCHA from "react-google-recaptcha";
import "../../assets/css/signin.css";
import Cookies from "js-cookie";

export default function Signin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errorDisplay, setErrorDisplay] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [recaptchaKey, setRecaptchaKey] = useState("6LdMceMqAAAAAIvQOWZXdqzeX6EYouBNktOpVYj5");

  useEffect(() => {
    // Forcer le rendu des composants externes
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();

    // Temporairement désactivé pour faciliter la connexion
    // if (!recaptchaToken) {
    //   setErrorDisplay("Please verify reCAPTCHA");
    //   return;
    // }

    try {
      const response = await fetch("http://localhost:5002/api/auth/signin", { // Mise à jour du port
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, recaptchaToken: recaptchaToken || 'disabled' }),
      });

      const data = await response.json();

      if (response.ok) {
        // Stocker le token dans un cookie
        Cookies.set("token", data.token, { expires: 7 });

        // Stocker les informations utilisateur dans localStorage
        localStorage.setItem("user", JSON.stringify(data.user));

        // Afficher les informations utilisateur pour le débogage
        console.log("User data received:", data.user);
        console.log("User type:", data.user.typeUser);

        // Déclencher l'événement userUpdated
        window.dispatchEvent(new Event("userUpdated"));

        // Rediriger vers la page d'accueil ou le tableau de bord admin
        if (data.user.typeUser === 'admin') {
          console.log("Redirecting to admin dashboard");
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else {
        setErrorDisplay(data.message || "Incorrect email or password");
      }
    } catch (err) {
      setErrorDisplay("An error occurred. Please try again.");
    }
  };

  const handleGoogleLoginSuccess = async () => {
    window.location.href = "http://localhost:5002/api/auth/google"; // Mise à jour du port
  };

  const handleGitHubLogin = () => {
    window.location.href = "http://localhost:5002/api/auth/github/callback"; // Mise à jour du port
  };

  return (
    <div className="signin-container">
      <h1 className="signin-logo">Sign In</h1>

      {errorDisplay && (
        <div className="error-message">
          {errorDisplay}
        </div>
      )}

      <form className="signin-form" onSubmit={onSubmit}>
        <div className="form-group">
          <input
            type="email"
            name="email"
            className="form-control"
            placeholder="Enter Email"
            onChange={onChange}
            value={formData.email}
            required
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            name="password"
            className="form-control"
            placeholder="Enter Password"
            onChange={onChange}
            value={formData.password}
            required
          />
        </div>

        <div className="recaptcha-container">
          <ReCAPTCHA
            sitekey={recaptchaKey}
            onChange={(token) => {
              console.log("ReCAPTCHA Token:", token);
              setRecaptchaToken(token);
            }}
          />
          {recaptchaToken && <p className="recaptcha-success">✅ reCAPTCHA validé !</p>}
        </div>

        <div className="forgot-password-container">
          <Link to="/resetpasswordemail" className="forgot-password-btn">
            Mot de passe oublié ?
          </Link>
        </div>

        <button type="submit" className="btn-submit">
          Se connecter
        </button>
      </form>

      <div className="divider">
        <span>Ou connectez-vous avec</span>
      </div>

      <div className="social-login">
        <div style={{ marginBottom: '15px' }}>
          <GoogleLoginButton onSuccess={handleGoogleLoginSuccess} />
        </div>

        <button
          onClick={handleGitHubLogin}
          className="social-btn github-login-btn"
        >
          <img
            src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
            alt="GitHub Logo"
          />
          Sign in with GitHub
        </button>
      </div>
    </div>
  );
}