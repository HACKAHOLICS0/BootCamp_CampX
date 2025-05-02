import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

// Créer une instance axios avec l'URL de base
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5002/api', // Utiliser le port 5002
});

// Ajouter un intercepteur pour les requêtes
axiosInstance.interceptors.request.use(
  (config) => {
    // Récupérer le token depuis localStorage ou cookies
    const token = localStorage.getItem('token') || Cookies.get('token');

    // Si un token existe, l'ajouter aux en-têtes
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Ajouter un intercepteur pour les réponses
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', error);

    // Afficher des informations détaillées sur l'erreur
    if (error.response) {
      // La requête a été faite et le serveur a répondu avec un code d'état
      // qui n'est pas dans la plage 2xx
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);

      const { status, data } = error.response;

      // Si le token est expiré ou invalide
      if (status === 401) {
        if (data.code === 'TOKEN_EXPIRED') {
          // Supprimer le token et les informations utilisateur
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          Cookies.remove('token');
          Cookies.remove('user');

          // Afficher un message à l'utilisateur
          toast.error('Your session has expired. Please sign in again.');

          // Rediriger vers la page de connexion
          setTimeout(() => {
            window.location.href = '/signin';
          }, 2000);
        } else {
          // Autre erreur d'authentification
          toast.error('Authentication error: ' + (data.message || 'Please sign in again'));
        }
      } else if (status === 404) {
        // Ressource non trouvée
        toast.error('Resource not found: ' + (data.message || 'The requested resource does not exist'));
      } else if (status >= 500) {
        // Erreur serveur
        toast.error('Server error: ' + (data.message || 'Something went wrong on the server'));
      }
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      console.error('Error request:', error.request);
      toast.error('Network error: No response received from server. Please check your connection.');
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      console.error('Error message:', error.message);
      toast.error('Request error: ' + error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
