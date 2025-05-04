/**
 * Exemple d'utilisation des scripts Python dans l'application Node.js
 */

const pythonBridge = require('./python_bridge');

// Exemple d'utilisation du script de validation de visage
async function testFaceValidator() {
  try {
    console.log('Test du script de validation de visage...');
    // Remplacez par le chemin d'une image de test
    const imagePath = '../uploads/test_image.jpg';
    const result = await pythonBridge.validateFace(imagePath);
    console.log('Résultat de la validation de visage :', result);
  } catch (error) {
    console.error('Erreur lors du test de validation de visage :', error);
  }
}

// Exemple d'utilisation du script d'analyse de marché
async function testMarketAnalyzer() {
  try {
    console.log('Test du script d\'analyse de marché...');
    const searchTerm = 'javascript';
    const result = await pythonBridge.analyzeMarket(searchTerm);
    console.log('Résultat de l\'analyse de marché :', result);
  } catch (error) {
    console.error('Erreur lors du test d\'analyse de marché :', error);
  }
}

// Exemple d'utilisation du script d'entraînement du modèle de chatbot
async function testTrainChatbotModel() {
  try {
    console.log('Test du script d\'entraînement du modèle de chatbot...');
    const result = await pythonBridge.trainChatbotModel();
    console.log('Résultat de l\'entraînement du modèle de chatbot :', result);
  } catch (error) {
    console.error('Erreur lors du test d\'entraînement du modèle de chatbot :', error);
  }
}

// Fonction principale
async function main() {
  // Décommentez les fonctions que vous souhaitez tester
  // await testFaceValidator();
  // await testMarketAnalyzer();
  // await testTrainChatbotModel();
  
  console.log('Tests terminés !');
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  main();
}

module.exports = {
  testFaceValidator,
  testMarketAnalyzer,
  testTrainChatbotModel
};
