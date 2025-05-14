import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

/**
 * Composant proxy pour contourner les probl�mes CORS lors de l'upload de vid�os
 * Ce composant sert d'interm�diaire pour envoyer les requ�tes d'upload de vid�os
 */
const VideoProxy = ({ onSuccess, onError }) => {
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Fonction pour uploader une vid�o en contournant les probl�mes CORS
   * @param {Object} formData - Les donn�es du formulaire � envoyer
   * @param {Function} onSuccess - Fonction � appeler en cas de succ�s
   * @param {Function} onError - Fonction � appeler en cas d'erreur
   */
  const uploadVideo = async (formData) => {
    try {
      setIsUploading(true);
      
      // R�cup�rer le token d'authentification
      const token = Cookies.get('token');
      
      // Cr�er une nouvelle instance axios pour �viter les probl�mes CORS
      const response = await axios({
        method: 'post',
        url: 'https://ikramsegni.fr/api/videos',
        data: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
          // Ajouter des en-t�tes pour �viter les probl�mes CORS
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
        },
        // Augmenter le timeout pour les fichiers volumineux
        timeout: 60000, // 60 secondes
        // D�sactiver la validation du certificat SSL si n�cessaire
        // httpsAgent: new https.Agent({ rejectUnauthorized: false })
      });
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'upload de la vid�o:', error);
      
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
