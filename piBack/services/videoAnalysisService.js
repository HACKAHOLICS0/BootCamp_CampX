const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;

class VideoAnalysisService {
  constructor() {
    this.tfidf = new TfIdf();
  }

  async analyzeVideo(videoPath) {
    try {
      // Simuler la détection de scènes en divisant la vidéo en segments de 5 minutes
      const scenes = this.generateScenes();
      
      // Simuler la transcription en utilisant des mots-clés génériques
      const transcriptions = this.generateTranscriptions();
      
      // Générer des questions basées sur les transcriptions
      const questions = this.generateQuestions(transcriptions);
      
      return {
        scenes,
        transcriptions,
        questions
      };
    } catch (error) {
      console.error('Erreur lors de l\'analyse de la vidéo:', error);
      throw error;
    }
  }

  generateScenes() {
    // Simuler 5 scènes de 5 minutes chacune
    return Array.from({ length: 5 }, (_, i) => ({
      startTime: i * 300, // 5 minutes en secondes
      endTime: (i + 1) * 300,
      description: `Scène ${i + 1}`
    }));
  }

  generateTranscriptions() {
    // Générer des transcriptions simulées avec des mots-clés éducatifs
    const keywords = [
      'apprentissage', 'éducation', 'formation', 'développement',
      'compétences', 'connaissances', 'méthodes', 'techniques',
      'pratique', 'théorie', 'exercices', 'exemples'
    ];

    return Array.from({ length: 5 }, (_, i) => {
      const randomKeywords = keywords
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .join(' ');
      return `Dans cette section, nous allons discuter de ${randomKeywords}.`;
    });
  }

  generateQuestions(transcriptions) {
    const questions = [];
    
    transcriptions.forEach((text, index) => {
      const words = tokenizer.tokenize(text);
      if (words && words.length > 0) {
        const question = this.createQuestionFromText(words);
        if (question) {
          questions.push({
            ...question,
            timestamp: index * 300, // 5 minutes en secondes
            sceneIndex: index
          });
        }
      }
    });

    return questions;
  }

  createQuestionFromText(words) {
    try {
      // S'assurer que words est un tableau de mots
      const wordArray = Array.isArray(words) ? words : String(words).split(/\s+/);
      
      if (!wordArray || wordArray.length === 0) {
        console.warn('Aucun mot fourni pour la génération de question');
        return null;
      }

      // Analyser le contenu pour extraire les informations importantes
      const content = wordArray.join(' ');
      const analysis = this.analyzeContent(content);
      
      if (analysis.technicalTerms.length === 0) {
        console.warn('Aucun terme technique trouvé dans le contenu');
        return null;
      }

      // Générer des questions basées sur le contenu réel
      const questionTypes = [
        {
          type: 'comprehension',
          template: `Dans cette section sur ${analysis.mainTopic}, ${analysis.actions[0]} ?`
        },
        {
          type: 'application',
          template: `Comment pouvez-vous ${analysis.actions[0]} ${analysis.technicalTerms[0]} comme montré dans la vidéo ?`
        },
        {
          type: 'analysis',
          template: analysis.technicalTerms.length > 1 
            ? `Quelle est la relation entre ${analysis.technicalTerms[0]} et ${analysis.technicalTerms[1]} dans le contexte de ${analysis.mainTopic} ?`
            : `Quelles sont les caractéristiques principales de ${analysis.technicalTerms[0]} expliquées dans cette section ?`
        }
      ];

      // Sélectionner aléatoirement un type de question
      const selectedType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
      
      // Générer des options de réponses basées sur le contenu
      const options = this.generateRelevantOptions(analysis.technicalTerms, selectedType.type, analysis);
      
      // Déterminer la bonne réponse
      const correctAnswer = options[0]; // La première option est la bonne réponse

      return {
        question: selectedType.template,
        options,
        correctAnswer,
        explanation: `Cette question teste votre compréhension de ${analysis.mainTopic} et plus particulièrement de ${analysis.technicalTerms.join(', ')}.`,
        type: selectedType.type
      };
    } catch (error) {
      console.error('Erreur lors de la création de la question:', error);
      return null;
    }
  }

  extractKeyTerms(words) {
    try {
      // Extraire les termes clés du texte
      const keyTerms = [];
      const commonWords = new Set([
        'le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'mais', 'donc', 'car', 'ni', 'or',
        'de', 'du', 'des', 'en', 'dans', 'sur', 'sous', 'avec', 'sans', 'pour', 'par',
        'nous', 'vous', 'ils', 'elles', 'je', 'tu', 'il', 'elle', 'ce', 'ces',
        'est', 'sont', 'être', 'avoir', 'faire', 'aller', 'venir', 'pouvoir', 'vouloir',
        'dans', 'cette', 'ce', 'ces', 'cet', 'cette', 'ceux', 'celles', 'celui', 'celle',
        'abordons', 'explorons', 'étudions', 'examinons', 'couvrons', 'traiter', 'discutons'
      ]);

      // Ajouter des termes techniques spécifiques
      const technicalTerms = new Set([
        'algorithm', 'function', 'variable', 'class', 'method',
        'object', 'interface', 'implementation', 'inheritance',
        'polymorphism', 'encapsulation', 'abstraction', 'array',
        'string', 'number', 'boolean', 'loop', 'condition',
        'database', 'server', 'client', 'network', 'protocol',
        'framework', 'library', 'module', 'package', 'dependency',
        'debug', 'compile', 'runtime', 'syntax', 'semantic',
        'frontend', 'backend', 'api', 'rest', 'graphql',
        'html', 'css', 'javascript', 'python', 'java', 'c++',
        'react', 'angular', 'vue', 'node', 'express', 'django',
        'flask', 'spring', 'hibernate', 'sql', 'nosql'
      ]);
      
      words.forEach(word => {
        const cleanWord = word.toLowerCase().trim();
        if (!commonWords.has(cleanWord) && 
            (cleanWord.length > 3 || technicalTerms.has(cleanWord))) {
          keyTerms.push(word);
        }
      });

      // Si aucun terme clé n'est trouvé, utiliser des termes techniques par défaut
      if (keyTerms.length === 0) {
        const defaultTerms = Array.from(technicalTerms);
        const randomIndex = Math.floor(Math.random() * defaultTerms.length);
        keyTerms.push(defaultTerms[randomIndex]);
      }

      return keyTerms.slice(0, 2); // Retourner les 2 premiers termes clés
    } catch (error) {
      console.error('Erreur lors de l\'extraction des termes clés:', error);
      return [];
    }
  }

  generateRelevantOptions(technicalTerms, questionType, analysis) {
    try {
      // Générer des options de réponses basées sur le contenu réel
      const options = [];
      
      // Définir des réponses spécifiques pour chaque type de question
      const responses = {
        comprehension: {
          correct: analysis.keyPoints[0] || `Une réponse basée sur le contenu explicite de la vidéo concernant ${technicalTerms[0]}`,
          incorrect: [
            analysis.keyPoints[1] || `Une interprétation incorrecte du contenu de la vidéo concernant ${technicalTerms[0]}`,
            `Une information qui n'est pas mentionnée dans la vidéo`,
            `Une confusion avec un autre concept abordé dans la vidéo`
          ]
        },
        application: {
          correct: `Un exemple pratique montré dans la vidéo pour ${technicalTerms[0]}`,
          incorrect: [
            `Une application qui ne correspond pas au contexte de la vidéo`,
            `Une utilisation qui n'est pas mentionnée dans la vidéo`,
            `Un cas d'utilisation qui contredit les explications de la vidéo`
          ]
        },
        analysis: technicalTerms.length > 1 ? {
          correct: `Une relation expliquée dans la vidéo entre ${technicalTerms[0]} et ${technicalTerms[1]}`,
          incorrect: [
            `Une relation qui n'est pas mentionnée dans la vidéo`,
            `Une confusion entre les concepts expliqués dans la vidéo`,
            `Une relation qui contredit le contenu de la vidéo`
          ]
        } : {
          correct: `Les caractéristiques de ${technicalTerms[0]} expliquées dans la vidéo`,
          incorrect: [
            `Des caractéristiques qui ne sont pas mentionnées dans la vidéo`,
            `Des propriétés qui confondent les explications de la vidéo`,
            `Des attributs qui contredisent le contenu de la vidéo`
          ]
        }
      };

      // Ajouter la bonne réponse
      options.push(responses[questionType].correct);
      
      // Ajouter les mauvaises réponses
      options.push(...responses[questionType].incorrect);

      // Mélanger les options
      return this.shuffleArray(options);
    } catch (error) {
      console.error('Erreur lors de la génération des options:', error);
      return ['Option A', 'Option B', 'Option C', 'Option D'];
    }
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  async analyzeVideoContent(videoUrl, timestamp) {
    try {
      // Ne générer des questions qu'après 1 minute de visionnage
      if (timestamp < 60) {
        return {
          content: "La vidéo est en cours de lecture...",
          difficulty: "beginner",
          context: "Attendez d'avoir regardé au moins 1 minute de la vidéo pour obtenir des questions."
        };
      }

      // Extraire le texte de la vidéo autour du timestamp
      const startTime = Math.max(0, timestamp - 30); // 30 secondes avant
      const endTime = timestamp + 30; // 30 secondes après
      
      // Analyser le contenu de la vidéo
      const contentData = await this.extractVideoContent(videoUrl, startTime, endTime);
      
      // S'assurer que content est une chaîne de caractères
      const content = typeof contentData.content === 'string' ? contentData.content : JSON.stringify(contentData.content);
      
      // Analyser la difficulté du contenu
      const difficulty = this.analyzeDifficulty(content);
      
      // Extraire le contexte
      const context = this.extractContext(content);
      
      return {
        content: content,
        difficulty,
        context
      };
    } catch (error) {
      console.error('Erreur lors de l\'analyse du contenu vidéo:', error);
      throw error;
    }
  }

  async extractVideoContent(videoUrl, startTime, endTime) {
    try {
      // Extraire le sujet de la vidéo de l'URL
      const subject = this.extractSubjectFromUrl(videoUrl);
      
      // Analyser le contenu de la vidéo
      const contentData = await this.analyzeVideoSegment(videoUrl, startTime, endTime);
      
      // S'assurer que content est une chaîne de caractères
      const content = typeof contentData.content === 'string' ? contentData.content : JSON.stringify(contentData.content);
      
      // Extraire les points clés du contenu
      const keyPoints = this.extractKeyPoints(content);
      
      return {
        content: content,
        keyPoints: keyPoints,
        subject: subject
      };
    } catch (error) {
      console.error('Erreur lors de l\'extraction du contenu vidéo:', error);
      return {
        content: "Contenu de la vidéo à analyser...",
        keyPoints: [],
        subject: "programming"
      };
    }
  }

  async analyzeVideoSegment(videoUrl, startTime, endTime) {
    try {
      // Extraire le contenu réel de la vidéo
      const content = await this.transcribeVideoSegment(videoUrl, startTime, endTime);
      
      // S'assurer que content est une chaîne de caractères
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      
      // Analyser le contenu pour extraire les informations importantes
      const analysis = this.analyzeContent(contentStr);
      
      return {
        content: contentStr,
        analysis: analysis
      };
    } catch (error) {
      console.error('Erreur lors de l\'analyse du segment vidéo:', error);
      throw error;
    }
  }

  async transcribeVideoSegment(videoUrl, startTime, endTime) {
    try {
      // Ici, vous devrez implémenter la logique pour extraire le texte réel de la vidéo
      // Par exemple, en utilisant une API de transcription vidéo ou en analysant les sous-titres
      // Pour l'instant, nous allons simuler cette extraction avec un contenu plus réaliste
      const content = await this.simulateVideoContent(videoUrl, startTime, endTime);
      return content;
    } catch (error) {
      console.error('Erreur lors de la transcription du segment vidéo:', error);
      throw error;
    }
  }

  async simulateVideoContent(videoUrl, startTime, endTime) {
    // Simuler le contenu de la vidéo en fonction du sujet et du timestamp
    const subject = this.extractSubjectFromUrl(videoUrl);
    const duration = endTime - startTime;
    
    // Générer un contenu réaliste basé sur le sujet et le moment de la vidéo
    let content = "";
    
    if (subject === 'web') {
      if (startTime < 60) {
        content = "Dans cette première minute, nous allons voir comment configurer VS Code pour le développement web. Nous allons installer les extensions essentielles comme Live Server et HTML CSS Support.";
      } else if (startTime < 120) {
        content = "Maintenant, nous allons créer notre première page HTML. Nous allons voir comment structurer le document avec les balises de base comme html, head et body.";
      } else if (startTime < 180) {
        content = "Dans cette section, nous allons apprendre à insérer des images en HTML. Nous verrons comment utiliser la balise img et ses attributs essentiels comme src, alt, width et height.";
      }
    } else if (subject === 'python') {
      if (startTime < 60) {
        content = "Dans cette première minute, nous allons voir comment installer Python et configurer l'environnement de développement. Nous allons utiliser VS Code avec l'extension Python.";
      } else if (startTime < 120) {
        content = "Maintenant, nous allons créer notre premier script Python. Nous verrons comment utiliser les variables et les types de données de base.";
      } else if (startTime < 180) {
        content = "Dans cette section, nous allons explorer les listes en Python. Nous verrons comment créer, modifier et manipuler les listes avec différentes méthodes.";
      }
    }
    
    return content || "Contenu de la vidéo à analyser...";
  }

  analyzeContent(content) {
    // Analyser le contenu pour extraire les informations importantes
    const sentences = content.split(/[.!?]+/);
    const keyPoints = [];
    const technicalTerms = [];
    const actions = [];
    
    sentences.forEach(sentence => {
      // Extraire les termes techniques
      const terms = this.extractTechnicalTerms(sentence);
      technicalTerms.push(...terms);
      
      // Extraire les actions
      const action = this.extractAction(sentence);
      if (action) actions.push(action);
      
      // Extraire les points clés
      if (sentence.length > 20) {
        keyPoints.push(sentence.trim());
      }
    });
    
    return {
      keyPoints,
      technicalTerms: [...new Set(technicalTerms)],
      actions: [...new Set(actions)],
      mainTopic: this.extractMainTopic(sentences[0])
    };
  }

  extractTechnicalTerms(sentence) {
    const technicalTerms = new Set([
      'html', 'css', 'javascript', 'python', 'java', 'c++', 'algorithm', 'function',
      'variable', 'class', 'method', 'object', 'interface', 'implementation',
      'inheritance', 'polymorphism', 'encapsulation', 'abstraction', 'array',
      'string', 'number', 'boolean', 'loop', 'condition', 'database', 'server',
      'client', 'network', 'protocol', 'framework', 'library', 'module', 'package',
      'dependency', 'debug', 'compile', 'runtime', 'syntax', 'semantic',
      'vs code', 'extension', 'live server', 'html css support', 'script',
      'list', 'dictionary', 'tuple', 'set', 'method', 'function', 'class',
      'object', 'variable', 'type', 'data', 'string', 'number', 'boolean'
    ]);
    
    return sentence.toLowerCase().split(/\s+/).filter(word => technicalTerms.has(word));
  }

  extractAction(sentence) {
    const actionWords = new Set([
      'installer', 'configurer', 'créer', 'utiliser', 'explorer', 'voir',
      'apprendre', 'comprendre', 'appliquer', 'développer', 'programmer',
      'coder', 'déboguer', 'tester', 'exécuter', 'compiler', 'déployer'
    ]);
    
    const words = sentence.toLowerCase().split(/\s+/);
    const actionIndex = words.findIndex(word => actionWords.has(word));
    
    if (actionIndex !== -1) {
      return words.slice(actionIndex, actionIndex + 3).join(' ');
    }
    
    return null;
  }

  extractMainTopic(firstSentence) {
    // Extraire le sujet principal de la première phrase
    const topicWords = new Set([
      'html', 'css', 'javascript', 'python', 'java', 'c++', 'vs code',
      'développement', 'programmation', 'web', 'application', 'script',
      'code', 'programme', 'site', 'page', 'interface', 'base de données'
    ]);
    
    const words = firstSentence.toLowerCase().split(/\s+/);
    const topicIndex = words.findIndex(word => topicWords.has(word));
    
    if (topicIndex !== -1) {
      return words.slice(topicIndex, topicIndex + 2).join(' ');
    }
    
    return "programmation";
  }

  extractKeyPoints(content) {
    // Extraire les points clés du contenu en utilisant des techniques de traitement du langage naturel
    const sentences = content.split(/[.!?]+/);
    const keyPoints = [];
    
    sentences.forEach(sentence => {
      const words = sentence.trim().split(/\s+/);
      if (words.length > 3) {
        // Extraire les termes techniques et les concepts importants
        const technicalTerms = words.filter(word => 
          word.length > 3 && 
          !this.isCommonWord(word) && 
          this.isTechnicalTerm(word)
        );
        keyPoints.push(...technicalTerms);
      }
    });

    return [...new Set(keyPoints)]; // Éliminer les doublons
  }

  isCommonWord(word) {
    const commonWords = new Set([
      'le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'mais', 'donc', 'car', 'ni', 'or',
      'de', 'du', 'des', 'en', 'dans', 'sur', 'sous', 'avec', 'sans', 'pour', 'par',
      'nous', 'vous', 'ils', 'elles', 'je', 'tu', 'il', 'elle', 'ce', 'ces',
      'est', 'sont', 'être', 'avoir', 'faire', 'aller', 'venir', 'pouvoir', 'vouloir'
    ]);
    return commonWords.has(word.toLowerCase());
  }

  isTechnicalTerm(word) {
    const technicalTerms = new Set([
      'html', 'css', 'javascript', 'python', 'java', 'c++', 'algorithm', 'function',
      'variable', 'class', 'method', 'object', 'interface', 'implementation',
      'inheritance', 'polymorphism', 'encapsulation', 'abstraction', 'array',
      'string', 'number', 'boolean', 'loop', 'condition', 'database', 'server',
      'client', 'network', 'protocol', 'framework', 'library', 'module', 'package',
      'dependency', 'debug', 'compile', 'runtime', 'syntax', 'semantic'
    ]);
    return technicalTerms.has(word.toLowerCase());
  }

  analyzeDifficulty(content) {
    // Analyser la difficulté du contenu en fonction de différents facteurs
    const factors = {
      technicalTerms: this.countTechnicalTerms(content),
      sentenceComplexity: this.analyzeSentenceComplexity(content),
      conceptDensity: this.analyzeConceptDensity(content)
    };

    // Calculer un score de difficulté global
    const difficultyScore = (
      factors.technicalTerms * 0.4 +
      factors.sentenceComplexity * 0.3 +
      factors.conceptDensity * 0.3
    );

    // Catégoriser la difficulté
    if (difficultyScore < 0.3) return 'beginner';
    if (difficultyScore < 0.6) return 'intermediate';
    return 'advanced';
  }

  countTechnicalTerms(content) {
    // Compter le nombre de termes techniques dans le contenu
    const technicalTerms = new Set([
      'algorithm', 'function', 'variable', 'class', 'method',
      'object', 'interface', 'implementation', 'inheritance',
      'polymorphism', 'encapsulation', 'abstraction'
    ]);

    const words = content.toLowerCase().split(/\s+/);
    return words.filter(word => technicalTerms.has(word)).length / words.length;
  }

  analyzeSentenceComplexity(content) {
    // Analyser la complexité des phrases
    const sentences = content.split(/[.!?]+/);
    const avgWordsPerSentence = sentences.reduce((acc, sentence) => {
      return acc + sentence.trim().split(/\s+/).length;
    }, 0) / sentences.length;

    return Math.min(1, avgWordsPerSentence / 20); // Normaliser sur une échelle de 0 à 1
  }

  analyzeConceptDensity(content) {
    // Analyser la densité des concepts dans le contenu
    const words = content.split(/\s+/);
    const uniqueWords = new Set(words);
    return uniqueWords.size / words.length;
  }

  extractContext(content) {
    // Extraire le contexte principal du contenu
    const sentences = content.split(/[.!?]+/);
    const keySentences = sentences.slice(0, 3); // Prendre les 3 premières phrases
    return keySentences.join(' ');
  }

  extractSubjectFromUrl(videoUrl) {
    const url = videoUrl.toLowerCase();
    if (url.includes('html') || url.includes('web')) return 'web';
    if (url.includes('python')) return 'python';
    if (url.includes('javascript') || url.includes('js')) return 'javascript';
    if (url.includes('java')) return 'java';
    if (url.includes('c++') || url.includes('cpp')) return 'cpp';
    if (url.includes('machine') || url.includes('ml') || url.includes('ai')) return 'ai';
    return 'programming';
  }

  generateUseCase(term) {
    const useCases = {
      'html': 'créer une structure de page web',
      'css': 'styliser une page web',
      'javascript': 'ajouter de l\'interactivité à une page web',
      'python': 'traiter des données',
      'java': 'créer une application orientée objet',
      'c++': 'optimiser les performances d\'un programme',
      'algorithm': 'résoudre un problème complexe',
      'function': 'organiser le code de manière modulaire',
      'variable': 'stocker des données',
      'class': 'créer un objet avec des propriétés et méthodes',
      'method': 'définir un comportement pour un objet',
      'object': 'représenter une entité dans le programme',
      'interface': 'définir un contrat pour une classe',
      'implementation': 'réaliser une fonctionnalité',
      'inheritance': 'réutiliser le code d\'une classe existante',
      'polymorphism': 'traiter différents types d\'objets de manière uniforme',
      'encapsulation': 'protéger les données d\'un objet',
      'abstraction': 'simplifier un système complexe'
    };

    return useCases[term.toLowerCase()] || 'réaliser une tâche spécifique';
  }
}

module.exports = new VideoAnalysisService(); 