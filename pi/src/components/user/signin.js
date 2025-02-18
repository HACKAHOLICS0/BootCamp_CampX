// src/components/user/signin.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../../JS/UserProvider";
import GoogleLoginButton from "./GoogleLoginButton";
import "../../assets/css/signin.css";

export default function Signin() {
  const navigate = useNavigate();
  const { login } = useUser();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errorDisplay, setErrorDisplay] = useState("");

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        login(data.user);
        navigate("/");
      } else {
        setErrorDisplay(data.message || "Incorrect email or password");
      }
    } catch (err) {
      setErrorDisplay("An error occurred. Please try again.");
    }
  };

  // Gérer la connexion Google côté frontend :
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    // Vous pouvez envoyer credentialResponse.credential (l'id_token) à un endpoint dédié
    // Ici, nous appelons directement l'endpoint backend en redirigeant l'utilisateur
    // Une alternative serait de créer une route /api/auth/google qui accepte le token et renvoie un JWT
    // Pour cet exemple, nous redirigeons vers le backend qui lancera la stratégie Google.
    window.location.href = "http://localhost:5000/api/auth/google";
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
        <Link to="/forget-password" className="forgot-password-link">
          Forgot Password? Send verification code via SMS
        </Link>
        <Link to="/resetpasswordemail" className="forgot-password-link">
          Forgot Password? Send verification code via Email
        </Link>
        <div className="error-message" style={{ color: "red", textAlign: "center" }}>
          {errorDisplay}
        </div>
        <button type="submit" className="btn btn-submbb it">Submit</button>
      </form>
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <GoogleLoginButton onSuccess={handleGoogleLoginSuccess} />
      </div>
    </div>
  );
}
