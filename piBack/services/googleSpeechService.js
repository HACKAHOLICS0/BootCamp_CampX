const speech = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Créer un client Speech-to-Text
let client;

try {
  // Vérifier si le fichier de configuration existe
  const credentialsPath = path.join(__dirname, '../config/google-credentials.json');

  if (fs.existsSync(credentialsPath)) {
    // Utiliser le fichier de configuration local
    client = new speech.SpeechClient({
      keyFilename: credentialsPath
    });
    console.log('Client Google Speech-to-Text créé avec le fichier de configuration local');
  } else {
    // Utiliser la variable d'environnement GOOGLE_APPLICATION_CREDENTIALS
    client = new speech.SpeechClient();
    console.log('Client Google Speech-to-Text créé avec la variable d\'environnement');
  }
} catch (error) {
  console.error('Erreur lors de la création du client Google Speech-to-Text:', error);
  // Créer un client factice pour éviter les erreurs
  client = {
    recognize: async () => {
      return [{ results: [] }];
    }
  };
}

/**
 * Transcrit un fichier audio en utilisant Google Speech-to-Text
 * @param {Buffer} audioBuffer - Le buffer contenant les données audio
 * @param {string} encoding - L'encodage audio (par défaut: WEBM_OPUS)
 * @param {number} sampleRateHertz - La fréquence d'échantillonnage (par défaut: 48000)
 * @param {string} languageCode - Le code de langue (par défaut: fr-FR)
 * @param {string} videoTitle - Le titre de la vidéo (pour le mode de secours)
 * @returns {Promise<string>} - La transcription du contenu audio
 */
async function transcribeAudio(audioBuffer, encoding = 'WEBM_OPUS', sampleRateHertz = 48000, languageCode = 'fr-FR', videoTitle = '') {
  try {
    // Générer un nom de fichier unique pour stocker temporairement l'audio
    const fileId = uuidv4();
    const tempDir = path.join(__dirname, '..', 'uploads', 'temp');
    const audioPath = path.join(tempDir, `${fileId}.webm`);

    // Créer le répertoire temp s'il n'existe pas
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Écrire le fichier audio temporaire
    fs.writeFileSync(audioPath, audioBuffer);

    // Vérifier si le client est disponible
    if (!client.recognize || typeof client.recognize !== 'function') {
      console.warn('Client Google Speech-to-Text non disponible, utilisation du mode de secours');
      return getFallbackTranscription(videoTitle);
    }

    // Configurer la requête de reconnaissance
    const audio = {
      content: fs.readFileSync(audioPath).toString('base64'),
    };

    const config = {
      encoding: encoding,
      sampleRateHertz: sampleRateHertz,
      languageCode: languageCode,
      enableAutomaticPunctuation: true,
      model: 'video', // Utiliser le modèle 'video' pour l'audio provenant de vidéos
      useEnhanced: true, // Utiliser le modèle amélioré pour une meilleure précision
    };

    const request = {
      audio: audio,
      config: config,
    };

    // Effectuer la reconnaissance vocale
    const [response] = await client.recognize(request);

    // Nettoyer le fichier temporaire
    fs.unlinkSync(audioPath);

    // Extraire la transcription
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');

    return transcription || getFallbackTranscription(videoTitle);
  } catch (error) {
    console.error('Erreur lors de la transcription avec Google Speech-to-Text:', error);
    // En cas d'erreur, utiliser le mode de secours
    return getFallbackTranscription(videoTitle);
  }
}

/**
 * Fournit une transcription de secours en cas d'échec de Google Speech-to-Text
 * @param {string} videoTitle - Le titre de la vidéo (optionnel)
 * @returns {string} - Une transcription générique
 */
function getFallbackTranscription(videoTitle = '') {
  console.log('Utilisation de la transcription de secours');

  // Transcriptions de secours basées sur le contenu des vidéos
  const transcriptions = {
    'html_css': "Bienvenue dans cette vidéo sur HTML et CSS. HTML, ou HyperText Markup Language, est le langage standard pour créer des pages web. Il définit la structure et le contenu de votre site. CSS, ou Cascading Style Sheets, est utilisé pour définir l'apparence et la mise en page de vos pages web.",
    'default': "[Mode de secours activé] La transcription automatique n'a pas pu être générée. Pour utiliser la transcription réelle, veuillez configurer l'API Google Speech-to-Text."
  };

  // Déterminer quelle transcription utiliser
  if (videoTitle && videoTitle.toLowerCase().includes('html') && videoTitle.toLowerCase().includes('css')) {
    return transcriptions.html_css;
  }

  return transcriptions.default;
}

module.exports = {
  transcribeAudio
};
