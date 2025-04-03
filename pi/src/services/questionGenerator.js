import config from '../config';

const HUGGING_FACE_API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';
const HUGGING_FACE_API_KEY = process.env.REACT_APP_HUGGING_FACE_API_KEY;

// Configuration de la reconnaissance vocale
let recognition = null;
let isTranscribing = false;
let currentTranscription = '';
let transcriptionCallback = null;
let recognitionAttempts = 0;
const MAX_RECOGNITION_ATTEMPTS = 3;

if (typeof window !== 'undefined') {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'fr-FR';

    recognition.onstart = () => {
      console.log('Reconnaissance vocale démarrée');
      isTranscribing = true;
      currentTranscription = '';
      recognitionAttempts = 0;
    };

    recognition.onend = () => {
      console.log('Reconnaissance vocale terminée');
      isTranscribing = false;
      
      // Ne redémarrer que si on n'a pas atteint le nombre maximum de tentatives
      if (recognitionAttempts < MAX_RECOGNITION_ATTEMPTS) {
        setTimeout(() => {
          if (recognition && !isTranscribing) {
            try {
              recognition.start();
              recognitionAttempts++;
            } catch (error) {
              console.error('Erreur lors du redémarrage de la reconnaissance:', error);
            }
          }
        }, 1000); // Attendre 1 seconde avant de redémarrer
      }
    };

    recognition.onerror = (event) => {
      console.error('Erreur de reconnaissance vocale:', event.error);
      isTranscribing = false;

      // Gérer différemment selon le type d'erreur
      switch (event.error) {
        case 'network':
          console.log('Erreur réseau, tentative de reconnexion...');
          if (recognitionAttempts < MAX_RECOGNITION_ATTEMPTS) {
            setTimeout(() => {
              if (recognition && !isTranscribing) {
                try {
                  recognition.start();
                  recognitionAttempts++;
                } catch (error) {
                  console.error('Erreur lors de la reconnexion:', error);
                }
              }
            }, 2000); // Attendre plus longtemps pour les erreurs réseau
          }
          break;
        case 'no-speech':
          console.log('Aucun son détecté');
          break;
        case 'not-allowed':
          console.log('Accès au microphone non autorisé');
          break;
        default:
          console.log('Autre erreur de reconnaissance');
      }
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join(' ');
      
      currentTranscription = transcript;
      console.log('Transcription en cours:', currentTranscription);
      
      // Notifier le callback si défini
      if (transcriptionCallback) {
        transcriptionCallback(currentTranscription);
      }
    };
  }
}

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
      console.log('Démarrage de la reconnaissance vocale');
      try {
        recognition.start();
      } catch (error) {
        console.error('Erreur lors du démarrage de la reconnaissance:', error);
        // En cas d'erreur, retourner une transcription par défaut
        return {
          content: "La reconnaissance vocale n'est pas disponible pour le moment.",
          contentType: "general",
          keyPoints: [],
          timestamp: timestamp
        };
      }
    }

    // Retourner la transcription actuelle
    const content = currentTranscription.trim();
    console.log('Transcription retournée:', content);

    return {
      content: content,
      contentType: detectContentType(content),
      keyPoints: extractKeyPoints(content),
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
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) {
      return generateDefaultQuestion(contentType);
    }

    // Sélectionner une phrase clé pour la question
    const keySentence = sentences[Math.floor(Math.random() * sentences.length)].trim();
    
    // Générer des options basées sur le contenu
    const options = generateOptionsFromContent(content, keySentence);
    
    // Formater le temps
    const minutes = Math.floor(timestamp / 60);
    const seconds = Math.floor(timestamp % 60);
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return {
      question: {
        text: `Quelle est la signification de cette partie du tutoriel : "${keySentence}" ?`,
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
const generateOptionsFromContent = (content, keySentence) => {
  try {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const options = [keySentence];
    
    // Ajouter d'autres phrases comme options
    while (options.length < 4 && sentences.length > 0) {
      const randomIndex = Math.floor(Math.random() * sentences.length);
      const option = sentences[randomIndex].trim();
      if (!options.includes(option)) {
        options.push(option);
      }
      sentences.splice(randomIndex, 1);
    }
    
    // Compléter avec des options par défaut si nécessaire
    while (options.length < 4) {
      options.push(`Option ${options.length + 1}`);
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
    
    // Si la transcription est vide, retourner une question par défaut
    if (!content || content.trim() === '') {
      return generateDefaultQuestion(contentType);
    }

    // Si l'API Hugging Face n'est pas disponible, générer une question basée sur le contenu
    if (!HUGGING_FACE_API_KEY) {
      return generateQuestionFromContent(content, contentType, timestamp);
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
          
          Transcription: "${content}"
          Points clés: "${keyPoints.join('. ')}"
          Type de contenu: ${contentType}
          
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
        const minutes = Math.floor(timestamp / 60);
        const seconds = Math.floor(timestamp % 60);
        const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        return {
          question: {
            text: questionText,
            options: options.length >= 4 ? options : generateOptionsFromContent(content, questionText),
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
      return generateQuestionFromContent(content, contentType, timestamp);
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