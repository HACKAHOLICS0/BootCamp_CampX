import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

const VerifyEmailPage = () => {
  const { token } = useParams(); // Récupère le token de l'URL
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying, success, expired, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(`https://ikramsegni.fr/api/auth/verify-email/${token}`, {
          method: "POST",
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully! You can now log in.");
          // Redirection automatique après 3 secondes
          setTimeout(() => {
            navigate("/signin");
          }, 3000);
        } else {
          if (data.expired) {
            setStatus("expired");
            setMessage(data.message || "Verification link has expired. Please request a new verification email.");
          } else {
            setStatus("error");
            setMessage(data.message || "Invalid verification token");
          }
        }
      } catch (error) {
        console.error("Error verifying email:", error);
        setStatus("error");
        setMessage("An error occurred during verification. Please try again.");
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body text-center">
              <h2 className="card-title mb-4">Email Verification</h2>

              {status === "verifying" && (
                <>
                  <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p>Verifying your email address...</p>
                </>
              )}

              {status === "success" && (
                <>
                  <div className="alert alert-success" role="alert">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    {message}
                  </div>
                  <p>Redirecting to login page in 3 seconds...</p>
                  <Link to="/signin" className="btn btn-primary">
                    Go to Login
                  </Link>
                </>
              )}

              {status === "expired" && (
                <>
                  <div className="alert alert-warning" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {message}
                  </div>
                  <p>Please sign up again to receive a new verification email.</p>
                  <Link to="/signup" className="btn btn-primary">
                    Sign Up Again
                  </Link>
                </>
              )}

              {status === "error" && (
                <>
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-x-circle-fill me-2"></i>
                    {message}
                  </div>
                  <p>Please try again or contact support if the problem persists.</p>
                  <div className="d-flex justify-content-center gap-2">
                    <Link to="/signup" className="btn btn-primary">
                      Sign Up Again
                    </Link>
                    <Link to="/" className="btn btn-secondary">
                      Go to Home
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;