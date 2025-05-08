import * as faceapi from 'face-api.js';

/**
 * Télécharge les modèles de face-api.js et les enregistre dans le dossier public/models
 */
export const downloadFaceApiModels = async () => {
  try {
    console.log('Téléchargement des modèles face-api.js...');
    
    // URL des modèles sur le CDN de face-api.js
    const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
    
    // Liste des modèles à télécharger
    const models = [
      'tiny_face_detector_model-weights_manifest.json',
      'tiny_face_detector_model-shard1',
      'face_landmark_68_model-weights_manifest.json',
      'face_landmark_68_model-shard1',
      'face_recognition_model-weights_manifest.json',
      'face_recognition_model-shard1',
      'face_recognition_model-shard2',
      'face_expression_model-weights_manifest.json',
      'face_expression_model-shard1'
    ];
    
    // Télécharger chaque modèle
    for (const model of models) {
      const response = await fetch(`${MODEL_URL}/${model}`);
      const blob = await response.blob();
      
      // Créer un lien pour télécharger le fichier
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = model;
      link.click();
      
      // Libérer l'URL
      URL.revokeObjectURL(link.href);
    }
    
    console.log('Modèles téléchargés avec succès!');
    
    // Charger les modèles depuis le dossier public/models
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      faceapi.nets.faceExpressionNet.loadFromUri('/models')
    ]);
    
    console.log('Modèles chargés avec succès!');
    return true;
  } catch (error) {
    console.error('Erreur lors du téléchargement des modèles:', error);
    return false;
  }
};

/**
 * Vérifie si les modèles sont déjà téléchargés
 */
export const checkModelsExist = async () => {
  try {
    const response = await fetch('/models/tiny_face_detector_model-weights_manifest.json');
    return response.ok;
  } catch (error) {
    return false;
  }
};
