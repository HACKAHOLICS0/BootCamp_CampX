/**
 * Utilitaire pour gérer les modèles face-api.js
 */

// URL de base des modèles
const MODELS_CDN_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

// Liste des fichiers de modèles nécessaires
const MODEL_FILES = [
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

/**
 * Vérifie si un modèle est disponible localement
 * @param {string} modelName - Nom du fichier du modèle
 * @returns {Promise<boolean>} - True si le modèle est disponible
 */
export const isModelAvailable = async (modelName) => {
  try {
    const response = await fetch(`/models/${modelName}`);
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Télécharge un fichier de modèle depuis le CDN
 * @param {string} modelName - Nom du fichier du modèle
 * @returns {Promise<ArrayBuffer>} - Données du modèle
 */
export const downloadModelFile = async (modelName) => {
  try {
    console.log(`Téléchargement du modèle: ${modelName}`);
    const response = await fetch(`${MODELS_CDN_URL}/${modelName}`);
    
    if (!response.ok) {
      throw new Error(`Erreur lors du téléchargement du modèle ${modelName}: ${response.status}`);
    }
    
    return await response.arrayBuffer();
  } catch (error) {
    console.error(`Erreur lors du téléchargement du modèle ${modelName}:`, error);
    throw error;
  }
};

/**
 * Stocke un modèle dans le cache du navigateur
 * @param {string} modelName - Nom du fichier du modèle
 * @param {ArrayBuffer} data - Données du modèle
 */
export const storeModelInCache = async (modelName, data) => {
  try {
    // Utiliser l'API Cache pour stocker le modèle
    const cache = await caches.open('face-api-models');
    const response = new Response(data);
    await cache.put(`/models/${modelName}`, response);
    console.log(`Modèle ${modelName} stocké dans le cache`);
  } catch (error) {
    console.error(`Erreur lors du stockage du modèle ${modelName} dans le cache:`, error);
    throw error;
  }
};

/**
 * Télécharge tous les modèles nécessaires
 * @returns {Promise<boolean>} - True si tous les modèles ont été téléchargés avec succès
 */
export const downloadAllModels = async () => {
  try {
    console.log('Vérification et téléchargement des modèles face-api.js...');
    
    // Vérifier quels modèles sont déjà disponibles
    const modelsToDownload = [];
    for (const modelFile of MODEL_FILES) {
      const isAvailable = await isModelAvailable(modelFile);
      if (!isAvailable) {
        modelsToDownload.push(modelFile);
      }
    }
    
    if (modelsToDownload.length === 0) {
      console.log('Tous les modèles sont déjà disponibles.');
      return true;
    }
    
    console.log(`Téléchargement de ${modelsToDownload.length} modèles manquants...`);
    
    // Télécharger et stocker les modèles manquants
    for (const modelFile of modelsToDownload) {
      const modelData = await downloadModelFile(modelFile);
      await storeModelInCache(modelFile, modelData);
    }
    
    console.log('Tous les modèles ont été téléchargés et stockés avec succès.');
    return true;
  } catch (error) {
    console.error('Erreur lors du téléchargement des modèles:', error);
    return false;
  }
};

/**
 * Récupère un modèle depuis le cache
 * @param {string} modelName - Nom du fichier du modèle
 * @returns {Promise<Response>} - Réponse contenant le modèle
 */
export const getModelFromCache = async (modelName) => {
  try {
    const cache = await caches.open('face-api-models');
    return await cache.match(`/models/${modelName}`);
  } catch (error) {
    console.error(`Erreur lors de la récupération du modèle ${modelName} depuis le cache:`, error);
    return null;
  }
};
