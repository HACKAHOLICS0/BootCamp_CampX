import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone;

  const handleResetPassword = async () => {
    try {
      // Send the plain text password; let the back end hash it
      const response = await fetch("http://51.91.251.228:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      if (response.ok) {
        navigate("/signin");
      } else {
        const data = await response.json();
        setError(data.message || "Erreur lors de la réinitialisation.");
      }
    } catch (err) {
      setError("Problème de connexion au serveur.");
    }
  };

  return (
    <div>
      <h2>Réinitialiser le mot de passe</h2>
      <input
        type="password"
        placeholder="Nouveau mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleResetPassword}>Valider</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default ResetPassword;
