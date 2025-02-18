import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../../JS/UserProvider';
// Vous pouvez également utiliser une librairie pour décoder le token, ex. jwt-decode

const GoogleRedirectHandler = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useUser();

  useEffect(() => {
    if (!token) return;

    // Stocker le token (par exemple dans le localStorage)
    localStorage.setItem("token", token);

    // Option 1 : décoder le token pour récupérer quelques infos (si le payload le contient)
    // Vous pouvez utiliser la librairie jwt-decode : npm install jwt-decode
    // Exemple :
    // import jwtDecode from 'jwt-decode';
    // const decoded = jwtDecode(token);
    // login(decoded);

    // Option 2 : appeler votre endpoint backend pour récupérer les informations complètes de l'utilisateur
    // Exemple :
    // fetch('http://localhost:5000/api/auth/profile', {
    //   headers: { Authorization: `Bearer ${token}` },
    // })
    // .then(res => res.json())
    // .then(userData => login(userData))
    // .catch(err => console.error(err));

    // Ici, nous utiliserons une méthode simple en décodant le token sans librairie (si le payload contient par exemple { id, iat, exp })
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
