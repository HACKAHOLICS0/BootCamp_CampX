import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ResetPasswordEmail= () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
  
    const handleSendEmail = async () => {
      setMessage("");
      try {
        const response = await fetch("https://ikramsegni.fr/api/auth/forgotpasswordemail", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });
  
        const data = await response.json();
        if (response.ok) {
          setMessage("Email sent successfully!");
          navigate("/verifycodeEmail");
          
        } else {
          setMessage(data.message || "Failed to send email");
        }
      } catch (error) {
        setMessage("An error occurred. Please try again.");
      }
    };
  
    return (
      <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
        <h2>Test Email Sending</h2>
        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />
        <button onClick={handleSendEmail} style={{ padding: "10px 20px", cursor: "pointer" }}>
          Send Email
        </button>
        {message && <p style={{ marginTop: "10px", color: "red" }}>{message}</p>}
      </div>
    );
  };

export default ResetPasswordEmail;
