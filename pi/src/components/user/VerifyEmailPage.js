import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const VerifyEmailPage = () => {
  const { token } = useParams(); // Récupère le token de l'URL
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/auth/verify-email/${token}`, {
          method: "POST",
        });

        const data = await response.json();

        if (response.ok) {
          alert("Email verified successfully! You can now log in.");
          navigate("/login"); // Redirige vers la page de connexion
        } else {
          alert(data.message || "Invalid or expired token");
        }
      } catch (error) {
        console.error("Error verifying email:", error);
        alert("An error occurred. Please try again.");
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return <h2>Verifying your email...</h2>;
};

export default VerifyEmailPage;