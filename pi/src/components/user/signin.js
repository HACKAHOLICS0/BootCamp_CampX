import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import GoogleLoginButton from "./GoogleLoginButton";
import "../../assets/css/signin.css";
import Cookies from "js-cookie"; // Import de js-cookie

export default function Signin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errorDisplay, setErrorDisplay] = useState("");

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        Cookies.set("token", data.token, { expires: 7 }); // Expire dans 7 jours
        Cookies.set("user", JSON.stringify(data.user), { expires: 7 });
        window.dispatchEvent(new Event("userUpdated")); // Notifie le changement
        navigate("/"); // Redirige après la connexion
      } else {
        setErrorDisplay(data.message || "Incorrect email or password");
      }
    } catch (err) {
      setErrorDisplay("An error occurred. Please try again.");
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
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
