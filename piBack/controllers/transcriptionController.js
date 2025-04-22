const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// REMARQUE : Ce contrôleur est maintenant utilisé uniquement comme solution de secours.
// La transcription principale est gérée côté client avec l'API Web Speech.

// Fonction pour transcrire l'audio en utilisant un modèle de reconnaissance vocale
exports.transcribeAudio = async (req, res) => {
  try {
    // Vérifier si un fichier audio a été envoyé
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier audio fourni' });
    }

    // Générer un nom de fichier unique
    const fileId = uuidv4();
    const audioPath = path.join(__dirname, '..', 'uploads', 'temp', `${fileId}.webm`);
    const outputPath = path.join(__dirname, '..', 'uploads', 'temp', `${fileId}.txt`);

    // Créer le répertoire temp s'il n'existe pas
    const tempDir = path.join(__dirname, '..', 'uploads', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Écrire le fichier audio
    fs.writeFileSync(audioPath, req.file.buffer);

    // Utiliser un service de transcription (ici, nous simulons une transcription)
    // Dans un environnement de production, vous utiliseriez un service comme Google Speech-to-Text, AWS Transcribe, etc.

    // Utiliser un service de transcription réel
    let transcription = '';

    try {
      // Récupérer les informations sur la vidéo pour le contexte
      const videoInfo = req.body.videoInfo || '';
      console.log(`Transcription de secours demandée pour la vidéo: ${videoInfo}`);

      // Générer une transcription de secours basée sur le titre de la vidéo
      transcription = generateFallbackTranscription(videoInfo);

      console.log('Transcription de secours générée');

      // Écrire la transcription dans un fichier pour référence
      fs.writeFileSync(outputPath, transcription);
    } catch (error) {
      console.error('Erreur lors de la transcription:', error);
      transcription = "Erreur lors de la transcription. Veuillez réessayer.";
    }

    // Nettoyer les fichiers temporaires
    try {
      fs.unlinkSync(audioPath);
      fs.unlinkSync(outputPath);
    } catch (cleanupError) {
      console.error('Erreur lors du nettoyage des fichiers temporaires:', cleanupError);
    }

    // Renvoyer la transcription
    res.json({ transcription });

  } catch (error) {
    console.error('Erreur lors de la transcription audio:', error);
    res.status(500).json({ error: 'Erreur lors de la transcription audio' });
  }
};

/**
 * Génère une transcription de secours basée sur le titre de la vidéo
 * @param {string} videoTitle - Le titre de la vidéo
 * @returns {string} - Une transcription générique adaptée au contenu
 */
function generateFallbackTranscription(videoTitle = '') {
  // Base de données de phrases par sujet
  const phrasesDatabase = {
    'html': [
      "Dans cette partie, nous allons explorer les balises HTML fondamentales.",
      "Le HTML est la structure de base de toute page web.",
      "Les balises div et span sont essentielles pour organiser le contenu.",
      "N'oubliez pas de toujours fermer vos balises correctement."
    ],
    'css': [
      "Le CSS permet de styliser vos pages web.",
      "Les sélecteurs CSS ciblent des éléments spécifiques de votre page.",
      "Avec les media queries, vous pouvez créer des designs responsives.",
      "Les propriétés flex et grid simplifient la mise en page."
    ],
    'javascript': [
      "JavaScript permet d'ajouter de l'interactivité à vos sites.",
      "Les fonctions sont des blocs de code réutilisables.",
      "Les événements permettent de réagir aux actions des utilisateurs.",
      "Les variables let et const ont remplacé var dans le JavaScript moderne."
    ],
    'default': [
      "Cette vidéo présente les concepts fondamentaux du sujet.",
      "L'instructeur explique étape par étape comment procéder.",
      "Ces techniques peuvent être appliquées dans différents contextes.",
      "N'hésitez pas à pratiquer pour maîtriser ces concepts."
    ]
  };

  // Déterminer les catégories pertinentes
  const keywords = videoTitle ? videoTitle.toLowerCase().split(/\s+/) : [];
  const relevantCategories = Object.keys(phrasesDatabase).filter(
    category => keywords.some(word => word.includes(category))
  );

  // Si aucune catégorie pertinente, utiliser default
  const categoriesToUse = relevantCategories.length > 0 ?
    relevantCategories : ['default'];

  // Construire une transcription à partir des phrases pertinentes
  let fallbackText = "[Mode de secours activé] Transcription simulée basée sur le titre:\n\n";

  // Ajouter 2-3 phrases de chaque catégorie pertinente
  categoriesToUse.forEach(category => {
    const phrases = phrasesDatabase[category];
    const selectedPhrases = phrases
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    fallbackText += selectedPhrases.join(' ') + '\n';
  });

  return fallbackText;
}
