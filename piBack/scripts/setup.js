/**
 * Script de configuration pour les scripts Python
 * Ce script installe les dépendances et initialise les modèles nécessaires
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { installDependencies } = require('./python_bridge');

// Fonction pour exécuter un script Python
function runPythonScript(scriptName) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, `${scriptName}.py`);

    console.log(`Exécution du script ${scriptName}.py...`);

    const pythonProcess = spawn('python3', [scriptPath]);

    pythonProcess.stdout.on('data', (data) => {
      console.log(data.toString());
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Le script ${scriptName}.py s'est terminé avec le code ${code}`));
      }
      resolve();
    });
  });
}

// Fonction principale
async function setup() {
  console.log('Configuration des scripts Python...');

  try {
    // Installer les dépendances
    console.log('Installation des dépendances...');
    await runPythonScript('install_dependencies');

    // Initialiser les modèles
    console.log('Initialisation des modèles...');
    await runPythonScript('initialize_models');

    console.log('Configuration terminée avec succès !');
  } catch (error) {
    console.error('Erreur lors de la configuration :', error);
  }
}

// Exécuter la configuration si le script est appelé directement
if (require.main === module) {
  setup();
}

module.exports = {
  setup
};
