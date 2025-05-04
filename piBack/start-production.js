/**
 * Script de démarrage pour l'environnement de production
 * Lance le serveur Node.js et le service Python du chatbot
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Configuration
const PORT = process.env.PORT || 5000;
const CHATBOT_PORT = process.env.CHATBOT_PORT || 5001;
const CHATBOT_HOST = process.env.CHATBOT_HOST || '0.0.0.0';

// Créer un dossier pour les logs s'il n'existe pas
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Fichiers de logs
const serverLogFile = fs.createWriteStream(path.join(logsDir, 'server.log'), { flags: 'a' });
const chatbotLogFile = fs.createWriteStream(path.join(logsDir, 'chatbot.log'), { flags: 'a' });

// Fonction pour écrire dans les logs avec timestamp
function log(stream, message) {
    const timestamp = new Date().toISOString();
    stream.write(`[${timestamp}] ${message}\n`);
    console.log(`[${timestamp}] ${message}`);
}

// Fonction pour déterminer la commande Python correcte selon l'OS
function getPythonCommand() {
    return os.platform() === 'win32' ? 'python' : 'python3';
}

// Démarrer le service Python du chatbot
function startChatbotService() {
    const pythonCommand = getPythonCommand();
    const scriptPath = path.join(__dirname, 'scripts', 'chatbot_service.py');
    
    log(chatbotLogFile, `Démarrage du service chatbot sur ${CHATBOT_HOST}:${CHATBOT_PORT}`);
    
    // Vérifier si le dossier models existe, sinon le créer
    const modelsDir = path.join(__dirname, 'models');
    if (!fs.existsSync(modelsDir)) {
        log(chatbotLogFile, `Création du dossier models: ${modelsDir}`);
        fs.mkdirSync(modelsDir, { recursive: true });
    }
    
    // Vérifier si le fichier intents.json existe
    const intentsFile = path.join(__dirname, 'scripts', 'intents.json');
    if (!fs.existsSync(intentsFile)) {
        log(chatbotLogFile, `ERREUR: Le fichier intents.json n'existe pas: ${intentsFile}`);
        return null;
    }
    
    // Construire la commande avec les arguments
    const args = [
        scriptPath,
        `--host=${CHATBOT_HOST}`,
        `--port=${CHATBOT_PORT}`
    ];
    
    // Lancer le processus Python
    const chatbotProcess = spawn(pythonCommand, args, {
        cwd: __dirname,
        env: {
            ...process.env,
            PYTHONUNBUFFERED: '1' // Pour voir les logs Python en temps réel
        }
    });
    
    // Gérer les logs
    chatbotProcess.stdout.on('data', (data) => {
        chatbotLogFile.write(data);
    });
    
    chatbotProcess.stderr.on('data', (data) => {
        chatbotLogFile.write(data);
    });
    
    // Gérer les erreurs et la fermeture
    chatbotProcess.on('error', (error) => {
        log(chatbotLogFile, `Erreur lors du démarrage du service chatbot: ${error.message}`);
    });
    
    chatbotProcess.on('close', (code) => {
        log(chatbotLogFile, `Le service chatbot s'est arrêté avec le code: ${code}`);
        
        // Redémarrer le service après un délai si ce n'est pas un arrêt normal
        if (code !== 0) {
            log(chatbotLogFile, `Redémarrage du service chatbot dans 5 secondes...`);
            setTimeout(() => {
                startChatbotService();
            }, 5000);
        }
    });
    
    return chatbotProcess;
}

// Démarrer le serveur Node.js
function startNodeServer() {
    log(serverLogFile, `Démarrage du serveur Node.js sur le port ${PORT}`);
    
    // Lancer le serveur Node.js
    const serverProcess = spawn('node', ['app.js'], {
        cwd: __dirname,
        env: {
            ...process.env,
            PORT: PORT
        }
    });
    
    // Gérer les logs
    serverProcess.stdout.on('data', (data) => {
        serverLogFile.write(data);
    });
    
    serverProcess.stderr.on('data', (data) => {
        serverLogFile.write(data);
    });
    
    // Gérer les erreurs et la fermeture
    serverProcess.on('error', (error) => {
        log(serverLogFile, `Erreur lors du démarrage du serveur Node.js: ${error.message}`);
    });
    
    serverProcess.on('close', (code) => {
        log(serverLogFile, `Le serveur Node.js s'est arrêté avec le code: ${code}`);
        
        // Redémarrer le serveur après un délai si ce n'est pas un arrêt normal
        if (code !== 0) {
            log(serverLogFile, `Redémarrage du serveur Node.js dans 5 secondes...`);
            setTimeout(() => {
                startNodeServer();
            }, 5000);
        }
    });
    
    return serverProcess;
}

// Gérer les signaux pour arrêter proprement les processus
function setupSignalHandlers(processes) {
    ['SIGINT', 'SIGTERM'].forEach(signal => {
        process.on(signal, () => {
            log(serverLogFile, `Signal ${signal} reçu, arrêt des processus...`);
            
            // Arrêter tous les processus
            processes.forEach(proc => {
                if (proc && !proc.killed) {
                    proc.kill();
                }
            });
            
            // Fermer les fichiers de logs
            serverLogFile.end();
            chatbotLogFile.end();
            
            process.exit(0);
        });
    });
}

// Fonction principale
function main() {
    log(serverLogFile, '=== DÉMARRAGE DE L\'APPLICATION EN MODE PRODUCTION ===');
    
    // Démarrer les services
    const chatbotProcess = startChatbotService();
    const serverProcess = startNodeServer();
    
    // Configurer les gestionnaires de signaux
    setupSignalHandlers([chatbotProcess, serverProcess]);
    
    // Vérifier périodiquement si le service chatbot est accessible
    setInterval(() => {
        const http = require('http');
        const req = http.get(`http://${CHATBOT_HOST === '0.0.0.0' ? '127.0.0.1' : CHATBOT_HOST}:${CHATBOT_PORT}/health`, (res) => {
            log(serverLogFile, `Service chatbot accessible: ${res.statusCode}`);
        });
        
        req.on('error', () => {
            log(serverLogFile, `Service chatbot non accessible, tentative de redémarrage...`);
            if (chatbotProcess && !chatbotProcess.killed) {
                chatbotProcess.kill();
            }
        });
        
        req.end();
    }, 60000); // Vérifier toutes les minutes
}

// Lancer l'application
main();
