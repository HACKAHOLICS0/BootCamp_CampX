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
    // Créer une question simple basée sur les mots du texte
    const questionWords = words.slice(0, 5);
    const question = `Quelle est la signification de "${questionWords.join(' ')}" ?`;
    
    // Générer des options de réponses
    const options = [
      'Option A',
      'Option B',
      'Option C',
      'Option D'
    ];

    return {
      question,
      options,
      correctAnswer: 'Option A',
      explanation: `Cette question concerne ${questionWords.join(' ')}.`
    };
  }
}

module.exports = new VideoAnalysisService(); 