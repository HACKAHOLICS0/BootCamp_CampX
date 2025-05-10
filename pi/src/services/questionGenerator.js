import config from '../config';

const HUGGING_FACE_API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';
const HUGGING_FACE_API_KEY = process.env.REACT_APP_HUGGING_FACE_API_KEY;

/* global webkitSpeechRecognition */

// Configuration de la reconnaissance vocale
let isTranscribing = false;
let currentTranscription = '';
let lastTranscription = '';
let transcriptionCallback = null;
let recognitionAttempts = 0;

// Configuration de la reconnaissance vocale
const setupRecognition = () => {
  if (!('webkitSpeechRecognition' in window)) {
    console.error('La reconnaissance vocale n\'est pas disponible');
    return null;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'fr-FR';

  recognition.onstart = () => {
    isTranscribing = true;
    currentTranscription = '';
    lastTranscription = '';
    recognitionAttempts = 0;
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(result => result[0])
      .map(result => result.transcript)
      .join(' ');
    
    // Ne mettre à jour que si la transcription a changé significativement
    if (transcript !== lastTranscription && transcript.length > lastTranscription.length) {
      currentTranscription = transcript;
      lastTranscription = transcript;
      
      // Notifier le callback si défini
      if (transcriptionCallback) {
        transcriptionCallback(currentTranscription);
      }
    }
  };

  recognition.onerror = (event) => {
    console.error('Erreur de reconnaissance:', event.error);
    isTranscribing = false;
    
    if (event.error === 'no-speech' && recognitionAttempts < 3) {
      recognitionAttempts++;
      setTimeout(() => {
        if (!isTranscribing) {
          try {
            recognition.start();
          } catch (error) {
            console.error('Erreur lors du redémarrage de la reconnaissance:', error);
          }
        }
      }, 1000);
    }
  };

  recognition.onend = () => {
    isTranscribing = false;
    if (recognitionAttempts < 3) {
      setTimeout(() => {
        if (!isTranscribing) {
          try {
            recognition.start();
          } catch (error) {
            console.error('Erreur lors du redémarrage de la reconnaissance:', error);
          }
        }
      }, 1000);
    }
  };

  return recognition;
};

let recognition = setupRecognition();

// Questions par défaut pour différents types de contenu
const defaultQuestions = {
  installation: [
    {
      text: "Quelle commande est utilisée pour installer les dépendances ?",
      options: ["npm install", "yarn add", "pip install", "composer require"],
      correctAnswer: "npm install",
      explanation: "Cette commande est utilisée pour installer les dépendances dans un projet Node.js."
    },
    {
      text: "Quel package manager est utilisé dans ce projet ?",
      options: ["npm", "yarn", "pip", "composer"],
      correctAnswer: "npm",
      explanation: "npm est le gestionnaire de paquets par défaut pour Node.js."
    }
  ],
  code: [
    {
      text: "Quelle est la syntaxe correcte pour déclarer une variable en JavaScript ?",
      options: ["let variable = value", "var variable = value", "const variable = value", "variable = value"],
      correctAnswer: "let variable = value",
      explanation: "let est la syntaxe moderne pour déclarer une variable en JavaScript."
    },
    {
      text: "Quelle balise HTML est utilisée pour créer un lien ?",
      options: ["<a>", "<link>", "<href>", "<url>"],
      correctAnswer: "<a>",
      explanation: "La balise <a> est utilisée pour créer des liens hypertextes en HTML."
    }
  ],
  configuration: [
    {
      text: "Quel fichier de configuration est utilisé pour les paramètres du projet ?",
      options: ["package.json", "config.js", "settings.json", "config.xml"],
      correctAnswer: "package.json",
      explanation: "package.json est le fichier de configuration principal pour les projets Node.js."
    }
  ],
  general: [
    {
      text: "Quelle est la fonction principale de cette section ?",
      options: ["Initialisation", "Configuration", "Exécution", "Terminaison"],
      correctAnswer: "Initialisation",
      explanation: "Cette section montre l'initialisation du projet."
    },
    {
      text: "Quel est le but de cette partie de la vidéo ?",
      options: ["Installation", "Configuration", "Développement", "Test"],
      correctAnswer: "Installation",
      explanation: "Cette partie montre le processus d'installation."
    }
  ]
};

// Fonction pour générer une transcription simulée basée sur le timestamp
const generateSimulatedTranscription = (timestamp) => {
  const minutes = Math.floor(timestamp / 60);
  const seconds = Math.floor(timestamp % 60);
  
  // Simuler différents types de contenu basés sur le temps
  if (minutes < 2) {
    return `Dans cette première partie, nous allons installer les dépendances nécessaires pour notre projet. 
    Nous utiliserons npm pour gérer nos packages. La commande principale sera npm install.`;
  } else if (minutes < 4) {
    return `Maintenant que l'installation est terminée, nous allons configurer notre environnement de développement. 
    Nous devons créer un fichier .env pour les variables d'environnement.`;
  } else if (minutes < 6) {
    return `Passons à la partie développement. Nous allons créer notre première fonction en JavaScript. 
    La syntaxe pour déclarer une fonction est function nomDeLaFonction() {}.`;
  } else {
    return `Dans cette section, nous allons tester notre application. 
    Les tests sont essentiels pour garantir la qualité du code.`;
  }
};

// Fonction pour nettoyer la transcription
const cleanTranscription = (text) => {
  if (!text) return '';
  
  // Supprimer les espaces multiples
  let cleaned = text.replace(/\s+/g, ' ');
  
  // Supprimer les espaces avant la ponctuation
  cleaned = cleaned.replace(/\s+([.,!?])/g, '$1');
  
  // Supprimer les espaces au début et à la fin
  cleaned = cleaned.trim();
  
  return cleaned;
};

// Fonction pour extraire les phrases clés
const extractKeyPhrases = (text) => {
  const cleanedText = cleanTranscription(text);
  const sentences = cleanedText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Filtrer les phrases importantes
  const importantPhrases = sentences.filter(sentence => {
    const lowerSentence = sentence.toLowerCase();
    return (
      lowerSentence.includes('comment') ||
      lowerSentence.includes('pourquoi') ||
      lowerSentence.includes('comment faire') ||
      lowerSentence.includes('étape') ||
      lowerSentence.includes('important') ||
      lowerSentence.includes('conseil') ||
      lowerSentence.includes('astuce')
    );
  });
  
  return importantPhrases.length > 0 ? importantPhrases : sentences;
};

// Fonction pour formater le temps
const formatTime = (timestamp) => {
  if (typeof timestamp !== 'number' || isNaN(timestamp)) {
    console.error('Timestamp invalide:', timestamp);
    return '0:00';
  }
  
  const minutes = Math.floor(timestamp / 60);
  const seconds = Math.floor(timestamp % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Fonction pour analyser le contenu vidéo avec transcription
export const analyzeVideoContent = async (videoElement, timestamp, callback) => {
  try {
    if (!recognition) {
      console.error('La reconnaissance vocale n\'est pas disponible');
      return {
        content: "",
        contentType: "general",
        keyPoints: [],
        timestamp: timestamp
      };
    }

    // Définir le callback pour les mises à jour en temps réel
    transcriptionCallback = callback;

    // Démarrer la reconnaissance si elle n'est pas déjà en cours
    if (!isTranscribing) {
      try {
        currentTranscription = '';
        lastTranscription = '';
        recognition.start();
      } catch (error) {
        console.error('Erreur lors du démarrage de la reconnaissance:', error);
        return {
          content: "La reconnaissance vocale n'est pas disponible pour le moment.",
          contentType: "general",
          keyPoints: [],
          timestamp: timestamp
        };
      }
    }

    // Retourner la transcription actuelle
    return {
      content: currentTranscription.trim(),
      contentType: detectContentType(currentTranscription),
      keyPoints: extractKeyPoints(currentTranscription),
      timestamp: timestamp
    };

  } catch (error) {
    console.error('Erreur dans le service d\'analyse vidéo:', error);
    return {
      content: "Une erreur est survenue lors de la transcription.",
      contentType: "general",
      keyPoints: [],
      timestamp: timestamp
    };
  }
};

// Fonction améliorée pour détecter le type de contenu
const detectContentType = (text) => {
  const lowerText = text.toLowerCase();
  
  const keywords = {
    installation: ['installer', 'installation', 'setup', 'npm', 'yarn', 'pip', 'composer', 'configuration initiale'],
    code: ['fonction', 'variable', 'class', 'méthode', 'html', 'css', 'javascript', 'code', 'programming'],
    configuration: ['configurer', 'paramètres', 'settings', 'environment', 'variables d\'environnement'],
    database: ['base de données', 'sql', 'mongodb', 'requête', 'table', 'collection'],
    testing: ['test', 'unittest', 'jest', 'mocha', 'cypress', 'testing'],
    deployment: ['déploiement', 'serveur', 'hosting', 'cloud', 'production']
  };

  const scores = Object.entries(keywords).reduce((acc, [category, words]) => {
    const score = words.reduce((sum, word) => {
      return sum + (lowerText.includes(word) ? 1 : 0);
    }, 0);
    acc[category] = score;
    return acc;
  }, {});

  const maxCategory = Object.entries(scores).reduce((max, [category, score]) => {
    return score > max.score ? { category, score } : max;
  }, { category: 'general', score: 0 });

  return maxCategory.score > 0 ? maxCategory.category : 'general';
};

// Fonction pour extraire les points clés du contenu
const extractKeyPoints = (text) => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const keyPoints = [];

  for (const sentence of sentences) {
    if (isImportantSentence(sentence)) {
      keyPoints.push(sentence.trim());
    }
  }

  return keyPoints;
};

// Fonction pour détecter les phrases importantes
const isImportantSentence = (sentence) => {
  const importantKeywords = [
    'important',
    'essentiel',
    'crucial',
    'noter',
    'attention',
    'rappel',
    'exemple',
    'étape',
    'premièrement',
    'deuxièmement',
    'finalement'
  ];

  const lowerSentence = sentence.toLowerCase();
  return importantKeywords.some(keyword => lowerSentence.includes(keyword));
};

// Fonction pour générer une question par défaut
const generateDefaultQuestion = (contentType) => {
  const validContentType = defaultQuestions[contentType] ? contentType : 'general';
  const questions = defaultQuestions[validContentType];
  
  if (!questions || questions.length === 0) {
    return {
      question: {
        text: "Quelle est la fonction principale de cette section ?",
        options: ["Initialisation", "Configuration", "Exécution", "Terminaison"],
        correctAnswer: "Initialisation",
        explanation: "Cette section montre l'initialisation du projet.",
        timestamp: "0:00"
      }
    };
  }

  const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
  
  return {
    question: {
      text: randomQuestion.text,
      options: randomQuestion.options,
      correctAnswer: randomQuestion.correctAnswer,
      explanation: randomQuestion.explanation,
      timestamp: "0:00"
    }
  };
};

// Fonction pour générer des questions basées sur le contenu
const generateQuestionFromContent = (content, contentType, timestamp) => {
  try {
    const cleanedContent = cleanTranscription(content);
    const keyPhrases = extractKeyPhrases(cleanedContent);
    
    if (keyPhrases.length === 0) {
      return generateDefaultQuestion(contentType);
    }

    // Sélectionner une phrase clé pour la question
    const keyPhrase = keyPhrases[Math.floor(Math.random() * keyPhrases.length)].trim();
    
    // Générer des options basées sur le contenu
    const options = generateOptionsFromContent(cleanedContent, keyPhrase);
    
    // Formater le temps
    const formattedTime = formatTime(timestamp);

    // Générer la question en fonction du type de contenu
    let questionText;
    if (contentType === 'code') {
      questionText = `Quelle est la fonction de cette partie du code : "${keyPhrase}" ?`;
    } else if (contentType === 'installation') {
      questionText = `Quelle est l'étape décrite ici : "${keyPhrase}" ?`;
    } else {
      questionText = `Quelle est la signification de cette partie du tutoriel : "${keyPhrase}" ?`;
    }

    return {
      question: {
        text: questionText,
        options: options,
        correctAnswer: options[0],
        explanation: `Cette question porte sur le contenu à ${formattedTime}`,
        timestamp: formattedTime
      }
    };
  } catch (error) {
    console.error('Erreur dans generateQuestionFromContent:', error);
    return generateDefaultQuestion(contentType);
  }
};

// Fonction pour générer des options basées sur le contenu
const generateOptionsFromContent = (content, keyPhrase) => {
  try {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const options = [keyPhrase];
    
    // Ajouter d'autres phrases comme options
    while (options.length < 4 && sentences.length > 0) {
      const randomIndex = Math.floor(Math.random() * sentences.length);
      const option = sentences[randomIndex].trim();
      if (!options.includes(option) && option !== keyPhrase) {
        options.push(option);
      }
      sentences.splice(randomIndex, 1);
    }
    
    // Compléter avec des options par défaut si nécessaire
    const defaultOptions = [
      "Cette partie explique une étape importante",
      "Cette partie montre comment configurer",
      "Cette partie décrit une fonctionnalité",
      "Cette partie donne un exemple"
    ];
    
    while (options.length < 4) {
      const randomOption = defaultOptions[Math.floor(Math.random() * defaultOptions.length)];
      if (!options.includes(randomOption)) {
        options.push(randomOption);
      }
    }
    
    return options.sort(() => Math.random() - 0.5);
  } catch (error) {
    console.error('Erreur dans generateOptionsFromContent:', error);
    return ["Option 1", "Option 2", "Option 3", "Option 4"];
  }
};

export const generateQuestion = async (videoContext) => {
  try {
    const { content, contentType, keyPoints, timestamp } = videoContext;
    
    // Vérifier que le timestamp est valide
    if (typeof timestamp !== 'number' || isNaN(timestamp)) {
      console.error('Timestamp invalide dans le contexte vidéo:', timestamp);
      return generateDefaultQuestion(contentType);
    }
    
    // Nettoyer la transcription
    const cleanedContent = cleanTranscription(content);
    
    // Si la transcription est vide, retourner une question par défaut
    if (!cleanedContent || cleanedContent.trim() === '') {
      return generateDefaultQuestion(contentType);
    }

    // Si l'API Hugging Face n'est pas disponible, générer une question basée sur le contenu
    if (!HUGGING_FACE_API_KEY) {
      return generateQuestionFromContent(cleanedContent, contentType, timestamp);
    }

    try {
      const response = await fetch(HUGGING_FACE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `En tant qu'expert pédagogique, génère une question à choix multiples précise et spécifique basée sur ce contenu:
          
          Transcription: "${cleanedContent}"
          Points clés: "${keyPoints.join('. ')}"
          Type de contenu: ${contentType}
          Timestamp: ${formatTime(timestamp)}
          
          La question doit tester la compréhension des concepts spécifiques mentionnés dans cette partie de la vidéo.
          Format: QUESTION: [question] OPTIONS: [4 options] CORRECT: [option correcte] EXPLANATION: [explication courte]`,
          parameters: {
            max_length: 200,
            num_return_sequences: 1,
            temperature: 0.7,
            top_p: 0.9,
            do_sample: true
          }
        })
      });

      if (!response.ok) {
        throw new Error('Erreur API Hugging Face');
      }

      const data = await response.json();
      
      if (!data || !data[0] || !data[0].generated_text) {
        throw new Error('Réponse invalide de l\'API');
      }

      const generatedText = data[0].generated_text;
      const questionMatch = generatedText.match(/QUESTION: (.*?) OPTIONS:/s);
      const optionsMatch = generatedText.match(/OPTIONS: (.*?) CORRECT:/s);
      const correctMatch = generatedText.match(/CORRECT: (.*?) EXPLANATION:/s);
      const explanationMatch = generatedText.match(/EXPLANATION: (.*?)$/s);

      if (questionMatch && optionsMatch && correctMatch) {
        const questionText = questionMatch[1].trim();
        const optionsText = optionsMatch[1].trim();
        const correctAnswer = correctMatch[1].trim();
        const explanation = explanationMatch ? explanationMatch[1].trim() : '';

        const options = optionsText.split('\n').map(opt => opt.trim()).filter(opt => opt);

        // Formater le temps correctement
        const formattedTime = formatTime(timestamp);

        return {
          question: {
            text: questionText,
            options: options.length >= 4 ? options : generateOptionsFromContent(cleanedContent, questionText),
            correctAnswer: correctAnswer,
            explanation: explanation || `Cette question teste votre compréhension du contenu à ${formattedTime}`,
            timestamp: formattedTime
          }
        };
      } else {
        throw new Error('Format de réponse invalide');
      }
    } catch (error) {
      console.error('Erreur avec l\'API Hugging Face:', error);
      return generateQuestionFromContent(cleanedContent, contentType, timestamp);
    }
  } catch (error) {
    console.error('Erreur dans la génération de question:', error);
    return generateDefaultQuestion('general');
  }
};

// Fonction utilitaire pour générer des options de réponse
const generateOptions = (contentType) => {
  const validContentType = defaultQuestions[contentType] ? contentType : 'general';
  const defaultOptions = defaultQuestions[validContentType]?.[0]?.options || [
    "Vrai",
    "Faux",
    "Je ne sais pas",
    "Aucune de ces réponses"
  ];
  
  return defaultOptions.sort(() => Math.random() - 0.5);
}; 