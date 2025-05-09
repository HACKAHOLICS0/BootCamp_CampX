import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  console.log("ForgotPassword loaded"); // Vérifie si le composant est bien monté

  const handleSendCode = async () => {
    try {
      const response = await fetch("https://ikramsegni.fr/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/verify-code", { state: { phone } });
      } else {
        setError(data.message || "Erreur lors de l'envoi du code");
      }
    } catch (err) {
      setError("Problème de connexion au serveur.");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Mot de passe oublié</h2>
      <label htmlFor="phone" style={{ display: "block", marginBottom: "5px" }}>
        Numéro de téléphone :
      </label>
      <input
        id="phone"
        type="tel"
        placeholder="Entrez votre numéro"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={{
          padding: "10px",
          fontSize: "16px",
          width: "250px",
          border: "1px solid black",
          borderRadius: "5px",
          display: "block",
          margin: "0 auto 10px auto",
        }}
      />
      <button
        onClick={handleSendCode}
        style={{
          padding: "10px 15px",
          fontSize: "16px",
          backgroundColor: "#007bff",
          color: "black",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Envoyer le code
      </button>
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
  );
};

export default ForgotPassword;
