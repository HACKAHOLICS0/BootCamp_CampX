const { PythonShell } = require('python-shell');
const path = require('path');
const axios = require('axios');

// URL du service Python (par défaut si le service Flask est exécuté localement)
const PYTHON_SERVICE_URL = 'http://127.0.0.1:5001';

// Fonction pour vérifier si le service Python est en cours d'exécution
const checkPythonService = async () => {
    try {
        const response = await axios.get(`${PYTHON_SERVICE_URL}/health`, { timeout: 2000 });
        return response.data.status === 'healthy';
    } catch (error) {
        console.log('Service Python non disponible:', error.message);
        return false;
    }
};

// Fonction pour démarrer le service Python
const startPythonService = () => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../scripts/chatbot_service.py');
        
        console.log('Démarrage du service Python...');
        
        const pythonProcess = PythonShell.run(scriptPath, {}, (err) => {
            if (err) {
                console.error('Erreur lors du démarrage du service Python:', err);
                reject(err);
            }
        });
        
        // Attendre que le service soit prêt
        const checkInterval = setInterval(async () => {
            const isRunning = await checkPythonService();
            if (isRunning) {
                clearInterval(checkInterval);
                console.log('Service Python démarré avec succès!');
                resolve(true);
            }
        }, 1000);
        
        // Timeout après 30 secondes
        setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error('Timeout: Impossible de démarrer le service Python'));
        }, 30000);
    });
};

// Fonction pour entraîner le modèle
const trainModel = () => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../scripts/train_model.py');
        
        console.log('Entraînement du modèle IA...');
        
        PythonShell.run(scriptPath, {}, (err, results) => {
            if (err) {
                console.error('Erreur lors de l\'entraînement du modèle:', err);
                reject(err);
            } else {
                console.log('Modèle entraîné avec succès!');
                console.log(results);
                resolve(results);
            }
        });
    });
};

// Fonction pour obtenir une prédiction du service Python
const getPrediction = async (message, userContext = {}) => {
    try {
        // Vérifier si le service est en cours d'exécution
        const isRunning = await checkPythonService();
        
        if (!isRunning) {
            // Essayer de démarrer le service s'il n'est pas en cours d'exécution
            try {
                await startPythonService();
            } catch (error) {
                throw new Error(`Impossible de démarrer le service Python: ${error.message}`);
            }
        }
        
        // Envoyer la requête au service Python
        const response = await axios.post(`${PYTHON_SERVICE_URL}/predict`, {
            message,
            context: userContext
        });
        
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la prédiction:', error.message);
        
        // Retourner une réponse par défaut en cas d'erreur
        return {
            response: "Désolé, je rencontre actuellement des difficultés techniques. Veuillez réessayer plus tard.",
            confidence: 0,
            intent: "error",
            error: error.message
        };
    }
};

module.exports = {
    checkPythonService,
    startPythonService,
    trainModel,
    getPrediction
};
