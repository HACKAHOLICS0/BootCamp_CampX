/**
 * Module pour faciliter l'exécution des scripts Python depuis Node.js
 * Ce module fournit des fonctions pour exécuter les scripts Python du projet
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Chemin vers le dossier des scripts Python
const SCRIPTS_DIR = path.join(__dirname);

/**
 * Exécute un script Python et retourne le résultat
 * @param {string} scriptName - Nom du script Python à exécuter (sans l'extension .py)
 * @param {Array} args - Arguments à passer au script Python
 * @returns {Promise<Object>} - Résultat de l'exécution du script
 */
function runPythonScript(scriptName, args = []) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(SCRIPTS_DIR, `${scriptName}.py`);

    // Vérifier si le script existe
    if (!fs.existsSync(scriptPath)) {
      return reject(new Error(`Le script ${scriptName}.py n'existe pas dans le dossier ${SCRIPTS_DIR}`));
    }

    // Exécuter le script Python
    const pythonProcess = spawn('python3', [scriptPath, ...args]);

    let result = '';
    let error = '';

    // Récupérer la sortie standard
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    // Récupérer la sortie d'erreur
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    // Gérer la fin de l'exécution
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Erreur lors de l'exécution du script Python: ${error}`));
      }

      try {
        // Essayer de parser le résultat en JSON
        const jsonResult = JSON.parse(result);
        resolve(jsonResult);
      } catch (e) {
        // Si le résultat n'est pas du JSON, retourner le résultat brut
        resolve({ result });
      }
    });
  });
}

/**
 * Valide une image avec le script face_validator.py
 * @param {string} imagePath - Chemin vers l'image à valider
 * @returns {Promise<Object>} - Résultat de la validation
 */
function validateFace(imagePath) {
  return runPythonScript('face_validator_cli', [imagePath]);
}

/**
 * Analyse le marché pour un terme de recherche donné
 * @param {string} searchTerm - Terme de recherche
 * @returns {Promise<Object>} - Résultat de l'analyse
 */
function analyzeMarket(searchTerm) {
  return runPythonScript('market_analyzer', [searchTerm]);
}

/**
 * Entraîne le modèle de chatbot
 * @returns {Promise<Object>} - Résultat de l'entraînement
 */
function trainChatbotModel() {
  return runPythonScript('train_model');
}

/**
 * Installe les dépendances Python nécessaires
 * @returns {Promise<Object>} - Résultat de l'installation
 */
function installDependencies() {
  return runPythonScript('install_dependencies');
}

module.exports = {
  runPythonScript,
  validateFace,
  analyzeMarket,
  trainChatbotModel,
  installDependencies
};
