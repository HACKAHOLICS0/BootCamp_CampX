import React, { useState } from "react";
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

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (!recaptchaToken) {
      setErrorDisplay("Please verify reCAPTCHA");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/signin", {
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
        navigate("/");
      } else {
        setErrorDisplay(data.message || "Incorrect email or password");
      }
    } catch (err) {
      setErrorDisplay("An error occurred. Please try again.");
    }
  };

  const handleGoogleLoginSuccess = async () => {
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  const handleGitHubLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/github/callback";
  };

  return (
    <div className="signin-container" style={{ marginTop: "100px", marginBottom: "100px" }}>
      <h1 className="signin-logo text-center">Sign In</h1>
      <form className="signin-form" onSubmit={onSubmit}>
        <div className="form-group">
          <input 
            type="email" 
            name="email" 
            className="form-control" 
            placeholder="Enter Email" 
            onChange={onChange} 
            value={formData.email}
          />
        </div>
        <div className="form-group my-2">
          <input 
            type="password" 
            name="password" 
            className="form-control" 
            placeholder="Enter Password" 
            onChange={onChange} 
            value={formData.password}
          />
        </div>
   
        {/* ✅ Correction du composant ReCAPTCHA */}
        <div>
          <ReCAPTCHA 
            sitekey="6LdMceMqAAAAAIvQOWZXdqzeX6EYouBNktOpVYj5"
            onChange={(token) => {
              console.log("ReCAPTCHA Token:", token);
              setRecaptchaToken(token);
            }}
          />
          {recaptchaToken && <p>✅ reCAPTCHA validé !</p>}
        </div>

        <div className="forgot-password-container">
          <Link to="/resetpasswordemail" className="forgot-password-btn">
            Forgot Password? 
          </Link>
        </div>
        <div 
  className={`error-message ${errorDisplay ? "active" : ""}`} 
  style={{ display: errorDisplay ? "block" : "none" }}
>
  {errorDisplay}
</div>

        <button type="submit" className="btn btn-submit">Submit</button>
      </form>
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <GoogleLoginButton onSuccess={handleGoogleLoginSuccess} />
      </div>
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button 
          onClick={handleGitHubLogin} 
          style={{ backgroundColor: "white", color: "black", border: "1px solid black", display: "flex", alignItems: "center", padding: "8px" }}
        >
          <img 
            src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" 
            alt="GitHub Logo" 
            style={{ width: "20px", height: "20px", marginRight: "8px" }}
          />
          Sign in with GitHub
        </button>
      </div>
    </div>
  );
}