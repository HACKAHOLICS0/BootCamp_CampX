import * as tf from '@tensorflow/tfjs';
import { load as loadEncoder } from '@tensorflow-models/universal-sentence-encoder';

// Classe pour gérer notre modèle IA simple
class ChatModel {
  constructor() {
    this.encoder = null;
    this.model = null;
    this.isReady = false;
    this.intents = [
      // Définition de quelques intentions simples pour entraîner notre modèle
      { tag: 'greeting', patterns: ['Bonjour', 'Salut', 'Hello', 'Hey', 'Coucou'], responses: ['Bonjour! Comment puis-je vous aider avec nos cours?', 'Salut! Que puis-je faire pour vous aujourd\'hui?'] },
      { tag: 'goodbye', patterns: ['Au revoir', 'A plus tard', 'A bientôt', 'Bye'], responses: ['Au revoir! N\'hésitez pas à revenir si vous avez d\'autres questions.', 'À bientôt! Bon apprentissage!'] },
      { tag: 'thanks', patterns: ['Merci', 'Je vous remercie', 'C\'est gentil', 'Merci beaucoup'], responses: ['De rien!', 'C\'est un plaisir de vous aider!', 'N\'hésitez pas si vous avez d\'autres questions.'] },
      { tag: 'courses', patterns: ['Quels cours proposez-vous?', 'Montrez-moi les cours disponibles', 'Liste des cours', 'Formations disponibles'], responses: ['Nous proposons des cours sur le développement web, la data science, l\'IA et plus encore. Consultez notre catalogue pour plus de détails.'] },
      { tag: 'pricing', patterns: ['Combien coûtent vos cours?', 'Prix des formations', 'Tarifs', 'Est-ce gratuit?'], responses: ['Nos prix varient selon les cours. Certains modules sont gratuits, d\'autres sont payants. Consultez chaque cours pour plus de détails.'] },
      { tag: 'account', patterns: ['Comment créer un compte?', 'Inscription', 'S\'enregistrer', 'Créer un profil'], responses: ['Vous pouvez créer un compte en cliquant sur "S\'inscrire" en haut à droite de la page d\'accueil.'] },
    ];
  }

  // Initialisation du modèle
  async initialize() {
    try {
      console.log('Chargement du modèle Universal Sentence Encoder...');
      this.encoder = await loadEncoder();
      console.log('Encoder chargé!');
      
      // Créer et entraîner notre modèle simple
      await this.trainModel();
      
      this.isReady = true;
      console.log('Le modèle est prêt à être utilisé!');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du modèle:', error);
      return false;
    }
  }

  // Entraînement du modèle avec nos intents prédéfinis
  async trainModel() {
    try {
      console.log('Préparation des données d\'entraînement...');
      
      // Extraire tous les patterns pour l'encodage
      const patterns = this.intents.flatMap(intent => intent.patterns);
      
      // Encoder les phrases avec le Universal Sentence Encoder
      const embeddings = await this.encoder.embed(patterns);
      
      // Créer les labels pour chaque phrase
      let labels = [];
      let patternToIntentMap = {};
      
      let index = 0;
      for (let i = 0; i < this.intents.length; i++) {
        const intent = this.intents[i];
        for (let j = 0; j < intent.patterns.length; j++) {
          patternToIntentMap[index] = i;
          index++;
        }
      }
      
      // Préparer les labels one-hot
      const numClasses = this.intents.length;
      for (let i = 0; i < patterns.length; i++) {
        const label = tf.zeros([numClasses]);
        label.bufferSync().set(1, patternToIntentMap[i]);
        labels.push(label);
      }
      
      // Convertir en tenseurs
      const xs = embeddings;
      const ys = tf.stack(labels);
      
      // Créer un modèle simple
      this.model = tf.sequential();
      this.model.add(tf.layers.dense({
        inputShape: [512], // Dimension de sortie du Universal Sentence Encoder
        units: 128,
        activation: 'relu'
      }));
      this.model.add(tf.layers.dropout({ rate: 0.2 }));
      this.model.add(tf.layers.dense({
        units: numClasses,
        activation: 'softmax'
      }));
      
      // Compiler le modèle
      this.model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });
      
      console.log('Entraînement du modèle...');
      
      // Entraîner le modèle
      await this.model.fit(xs, ys, {
        epochs: 100,
        batchSize: 8,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
            }
          }
        }
      });
      
      console.log('Entraînement terminé!');
    } catch (error) {
      console.error('Erreur lors de l\'entraînement du modèle:', error);
      throw error;
    }
  }

  // Prédiction avec le modèle
  async predict(text) {
    if (!this.isReady) {
      throw new Error('Le modèle n\'est pas prêt. Appelez initialize() d\'abord.');
    }
    
    try {
      // Encoder le texte d'entrée
      const embedding = await this.encoder.embed(text);
      
      // Faire la prédiction
      const prediction = this.model.predict(embedding);
      
      // Récupérer l'index de la classe avec la plus haute probabilité
      const argmax = prediction.argMax(1);
      const classIndex = argmax.dataSync()[0];
      
      // Récupérer l'intent correspondant
      const intent = this.intents[classIndex];
      
      // Sélectionner une réponse aléatoire parmi les réponses possibles
      const randomIndex = Math.floor(Math.random() * intent.responses.length);
      const response = intent.responses[randomIndex];
      
      return {
        tag: intent.tag,
        confidence: prediction.dataSync()[classIndex],
        response
      };
    } catch (error) {
      console.error('Erreur lors de la prédiction:', error);
      throw error;
    }
  }
}

// Singleton pour ne créer qu'une seule instance du modèle
let chatModelInstance = null;

export const getChatModel = async () => {
  if (!chatModelInstance) {
    chatModelInstance = new ChatModel();
    await chatModelInstance.initialize();
  }
  return chatModelInstance;
};
