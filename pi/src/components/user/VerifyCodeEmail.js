import React, { useState } from "react";
import {  useNavigate } from "react-router-dom";

const VerifyCodeEmail = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleResetPassword = async () => {
    setMessage("");

    if (!email || !code || !password) {
      setMessage("Veuillez remplir tous les champs.");
      return;
    }

    try {
      const response = await fetch("https://ikramsegni.fr/api/auth/resetpasswordemail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code, password }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("Mot de passe mis à jour avec succès !");
        navigate("/signin");
      } else {
        setMessage(data.message || "Échec de la réinitialisation du mot de passe.");
      }
    } catch (error) {
      setMessage("Une erreur s'est produite. Veuillez réessayer.");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
      <h2>Réinitialiser le mot de passe</h2>
      <input
        type="email"
        placeholder="Votre email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
      />
      <input
        type="text"
        placeholder="Code de vérification"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
      />
      <input
        type="password"
        placeholder="Nouveau mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
      />
      <button onClick={handleResetPassword} style={{ padding: "10px 20px", cursor: "pointer" }}>
        Réinitialiser le mot de passe
      </button>
      {message && <p style={{ marginTop: "10px", color: "red" }}>{message}</p>}
    </div>
  );
};

export default VerifyCodeEmail;
