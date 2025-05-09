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
  const [recaptchaKey, setRecaptchaKey] = useState("6LfYvSwrAAAAAEQwkoqF-DyCmy7qIINm-RuH6qzs");

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

    if (!recaptchaToken) {
      setErrorDisplay("Veuillez vérifier le reCAPTCHA");
      return;
    }

    try {
      const response = await fetch("https://ikramsegni.fr/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, recaptchaToken }),
      });

      const data = await response.json();

      if (response.ok) {
        Cookies.set("token", data.token, { expires: 7 });
        Cookies.set("user", JSON.stringify(data.user), { expires: 7 });
        window.dispatchEvent(new Event("userUpdated"));

        // Check user role and redirect accordingly
        console.log("User data:", data.user);
        if (data.user && (data.user.role === "ADMIN" || data.user.typeUser === "admin")) {
          console.log("Admin user detected, redirecting to admin dashboard");
          navigate("/admin");
        } else {
          console.log("Regular user detected, redirecting to home page");
          navigate("/");
        }
      } else {
        setErrorDisplay(data.message || "Email ou mot de passe incorrect");
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrorDisplay("Une erreur s'est produite. Veuillez réessayer.");
    }
  };

  const handleGoogleLoginSuccess = async () => {
    window.location.href = "https://ikramsegni.fr/api/auth/google";
  };

  const handleGitHubLogin = () => {
    window.location.href = "https://ikramsegni.fr/api/auth/github/callback";
  };

  return (
    <div className="signin-container">
      <h1 className="signin-logo">Connexion</h1>

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
            placeholder="Entrez votre email"
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
            placeholder="Entrez votre mot de passe"
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
            alt="Logo GitHub"
          />
          Se connecter avec GitHub
        </button>
      </div>
    </div>
  );
}
