import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

/**
 * Composant proxy pour contourner les problèmes CORS lors de l'upload de vidéos
 * Ce composant sert d'intermédiaire pour envoyer les requêtes d'upload de vidéos
 */
const VideoProxy = ({ onSuccess, onError }) => {
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Fonction pour uploader une vidéo en contournant les problèmes CORS
   * @param {Object} formData - Les données du formulaire à envoyer
   * @param {Function} onSuccess - Fonction à appeler en cas de succès
   * @param {Function} onError - Fonction à appeler en cas d'erreur
   */
  const uploadVideo = async (formData) => {
    try {
      setIsUploading(true);
      
      // Récupérer le token d'authentification
      const token = Cookies.get('token');
      
      // Créer une nouvelle instance axios pour éviter les problèmes CORS
      const response = await axios({
        method: 'post',
        url: 'https://ikramsegni.fr/api/videos',
        data: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
          // Ajouter des en-têtes pour éviter les problèmes CORS
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
        },
        // Augmenter le timeout pour les fichiers volumineux
        timeout: 60000, // 60 secondes
        // Désactiver la validation du certificat SSL si nécessaire
        // httpsAgent: new https.Agent({ rejectUnauthorized: false })
      });
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'upload de la vidéo:', error);
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Exposer la fonction d'upload au composant parent
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.uploadVideoProxy = uploadVideo;
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete window.uploadVideoProxy;
      }
    };
  }, []);

  return null; // Ce composant ne rend rien visuellement
};

export default VideoProxy;
