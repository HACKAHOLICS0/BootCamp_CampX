const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Fonction pour déterminer la commande Python correcte selon l'OS
function getPythonCommand() {
    return os.platform() === 'win32' ? 'python' : 'python3';
}

// Vérifier la version de Python
function checkPythonVersion() {
    return new Promise((resolve, reject) => {
        const pythonCommand = getPythonCommand();
        const pythonProcess = spawn(pythonCommand, ['--version'], {
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: true
        });
        
        let output = '';
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                console.log(`Version de Python: ${output.trim()}`);
                resolve(true);
            } else {
                console.error(`Erreur lors de la vérification de la version de Python: ${output}`);
                resolve(false);
            }
        });
    });
}

// Vérifier les dépendances Python
function checkPythonDependencies() {
    return new Promise((resolve, reject) => {
        const pythonCommand = getPythonCommand();
        const script = `
import sys
try:
    import flask
    import flask_cors
    import tensorflow
    import nltk
    import numpy
    import requests
    print("Toutes les dépendances sont installées.")
    print(f"Flask: {flask.__version__}")
    print(f"TensorFlow: {tensorflow.__version__}")
    print(f"NumPy: {numpy.__version__}")
    print(f"Requests: {requests.__version__}")
    sys.exit(0)
except ImportError as e:
    print(f"Erreur: {e}")
    print("Certaines dépendances ne sont pas installées.")
    print("Exécutez 'pip install -r requirements.txt' pour installer les dépendances manquantes.")
    sys.exit(1)
`;
        
        const pythonProcess = spawn(pythonCommand, ['-c', script], {
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: true
        });
        
        let output = '';
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                console.log(output.trim());
                resolve(true);
            } else {
                console.error(output.trim());
                resolve(false);
            }
        });
    });
}

// Vérifier si le dossier models existe
function checkModelsDirectory() {
    const fs = require('fs');
    const modelsDir = path.join(__dirname, 'models');
    
    if (fs.existsSync(modelsDir)) {
        console.log(`Le dossier models existe: ${modelsDir}`);
        return true;
    } else {
        console.error(`Le dossier models n'existe pas: ${modelsDir}`);
        console.error('Créez le dossier models avec la commande:');
        console.error('mkdir models');
        return false;
    }
}

// Vérifier si le fichier intents.json existe
function checkIntentsFile() {
    const fs = require('fs');
    const intentsFile = path.join(__dirname, 'scripts', 'intents.json');
    
    if (fs.existsSync(intentsFile)) {
        console.log(`Le fichier intents.json existe: ${intentsFile}`);
        return true;
    } else {
        console.error(`Le fichier intents.json n'existe pas: ${intentsFile}`);
        console.error('Le service chatbot ne peut pas démarrer sans ce fichier.');
        return false;
    }
}

// Exécuter toutes les vérifications
async function runChecks() {
    console.log('Vérification des prérequis pour le service chatbot...');
    
    const pythonVersionOk = await checkPythonVersion();
    if (!pythonVersionOk) {
        console.error('Python n\'est pas correctement installé ou n\'est pas accessible dans le PATH.');
        return false;
    }
    
    const pythonDepsOk = await checkPythonDependencies();
    if (!pythonDepsOk) {
        console.error('Certaines dépendances Python sont manquantes.');
        return false;
    }
    
    const modelsDirectoryOk = checkModelsDirectory();
    const intentsFileOk = checkIntentsFile();
    
    if (pythonVersionOk && pythonDepsOk && modelsDirectoryOk && intentsFileOk) {
        console.log('Tous les prérequis sont satisfaits. Le service chatbot peut être démarré.');
        return true;
    } else {
        console.error('Certains prérequis ne sont pas satisfaits. Veuillez corriger les erreurs ci-dessus.');
        return false;
    }
}

// Exécuter les vérifications
runChecks().then((result) => {
    if (result) {
        console.log('Vous pouvez démarrer le service chatbot avec la commande:');
        console.log('python scripts/chatbot_service.py --host=127.0.0.1 --port=5000');
    } else {
        console.error('Veuillez corriger les erreurs ci-dessus avant de démarrer le service chatbot.');
    }
});
