/**
 * Script de test pour le générateur de questions
 * 
 * Ce script permet de tester la génération de questions basées sur différentes transcriptions
 * et titres de vidéos pour vérifier que les questions sont pertinentes.
 */

const { spawn } = require('child_process');
const path = require('path');

// Exemples de transcriptions et titres
const testCases = [
  {
    title: "Introduction à HTML et CSS",
    transcript: "HTML est un langage de balisage utilisé pour structurer le contenu des pages web. Les balises HTML comme div, p, h1 définissent la structure du document. CSS est un langage de style qui permet de définir l'apparence des éléments HTML. Avec CSS, vous pouvez changer les couleurs, les polices, les marges et bien plus encore."
  },
  {
    title: "Les bases de JavaScript",
    transcript: "JavaScript est un langage de programmation qui permet d'ajouter de l'interactivité aux pages web. Les variables en JavaScript peuvent être déclarées avec let, const ou var. Les fonctions sont des blocs de code réutilisables qui peuvent prendre des paramètres et retourner des valeurs. Les événements permettent de réagir aux actions des utilisateurs comme les clics ou la saisie de texte."
  },
  {
    title: "Vidéo sur le développement web",
    transcript: "Le développement web comprend plusieurs aspects comme le frontend et le backend. Le frontend concerne tout ce que l'utilisateur voit et avec quoi il interagit. Le backend gère la logique serveur et les bases de données. Pour devenir développeur web, il faut maîtriser plusieurs technologies et langages."
  }
];

// Fonction pour tester la génération de questions
async function testQuestionGeneration(title, transcript) {
  return new Promise((resolve, reject) => {
    console.log(`\n\n=== Test avec le titre: "${title}" ===`);
    console.log(`Transcription (extrait): "${transcript.substring(0, 100)}..."`);
    
    // Lancer le script Python
    const pythonProcess = spawn('python', [
      path.join(__dirname, 'models/QuestionGenerator.py'),
      transcript,
      title
    ]);
    
    let questionData = '';
    let errorData = '';
    
    // Collecter les données de sortie
    pythonProcess.stdout.on('data', (data) => {
      questionData += data.toString();
    });
    
    // Collecter les erreurs (qui incluent nos messages de debug)
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.log(`Debug: ${data.toString().trim()}`);
    });
    
    // Gérer la fin du processus
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Erreur du processus Python:', errorData);
        reject(new Error(`Erreur avec le code ${code}`));
        return;
      }
      
      try {
        const questions = JSON.parse(questionData);
        console.log("\nQuestions générées:");
        
        if (questions.length === 0) {
          console.log("Aucune question générée");
          resolve([]);
          return;
        }
        
        questions.forEach((q, i) => {
          console.log(`\nQuestion ${i+1}: ${q.question}`);
          console.log(`Domaine: ${q.domain}`);
          console.log(`Mots-clés: ${q.keywords?.join(', ')}`);
          console.log("Options:");
          q.options.forEach((opt, j) => {
            const isCorrect = opt === q.correct_answer;
            console.log(`  ${j+1}. ${opt}${isCorrect ? ' ✓' : ''}`);
          });
        });
        
        resolve(questions);
      } catch (error) {
        console.error('Erreur de parsing JSON:', error);
        reject(error);
      }
    });
  });
}

// Exécuter les tests
async function runTests() {
  console.log("=== TESTS DU GÉNÉRATEUR DE QUESTIONS ===");
  
  for (const testCase of testCases) {
    try {
      await testQuestionGeneration(testCase.title, testCase.transcript);
    } catch (error) {
      console.error(`Échec du test pour "${testCase.title}":`, error);
    }
  }
  
  console.log("\n=== TESTS TERMINÉS ===");
}

// Lancer les tests
runTests();
