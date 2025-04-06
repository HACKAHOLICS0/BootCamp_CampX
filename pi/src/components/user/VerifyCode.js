import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const VerifyCode = () => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone;

  const handleVerifyCode = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/reset-password", { state: { phone } });
      } else {
        setError(data.message || "Code invalide");
      }
    } catch (err) {
      setError("Problème de connexion au serveur.");
    }
  };

  return (
    <div>
      <h2>Vérification du Code</h2>
      <input
        type="text"
        placeholder="Code reçu par SMS"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button onClick={handleVerifyCode}>Vérifier</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default VerifyCode;
