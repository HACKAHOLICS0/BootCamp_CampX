import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../../JS/UserProvider';
// Vous pouvez également utiliser une librairie pour décoder le token, ex. jwt-decode
import Cookies from "js-cookie"; // Import de js-cookie

const GoogleRedirectHandler = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useUser();

  useEffect(() => {
    if (!token) return;

    // Stocker le token (par exemple dans le localStorage)
    localStorage.setItem("token", token);
    Cookies.set("token", token, { expires: 7 });
    window.dispatchEvent(new Event("userUpdated"));
 

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decodedUser = JSON.parse(jsonPayload);

      // Mettez à jour votre contexte utilisateur avec les infos disponibles
      login({ id: decodedUser.id, token });
    } catch (error) {
      console.error("Erreur lors du décodage du token :", error);
    }

    // Rediriger vers la page profil
    navigate('/');
  }, [token, login, navigate]);

  return <div>Connexion en cours…</div>;
};

export default GoogleRedirectHandler;
