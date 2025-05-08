const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Fonction pour déterminer la commande Python correcte selon l'OS
function getPythonCommand() {
    return os.platform() === 'win32' ? 'python' : 'python3';
}

// Démarrer le service Python du chatbot
function startChatbotService() {
    const pythonCommand = getPythonCommand();
    const scriptPath = path.join(__dirname, 'scripts', 'chatbot_service.py');

    console.log(`Démarrage du service chatbot avec: ${pythonCommand} ${scriptPath} --host=0.0.0.0 --port=5001`);

    // Vérifier si le dossier models existe, sinon le créer
    const modelsDir = path.join(__dirname, 'models');
    if (!require('fs').existsSync(modelsDir)) {
        console.log(`Création du dossier models: ${modelsDir}`);
        require('fs').mkdirSync(modelsDir, { recursive: true });
    }

    // Vérifier si le fichier intents.json existe
    const intentsFile = path.join(__dirname, 'scripts', 'intents.json');
    if (!require('fs').existsSync(intentsFile)) {
        console.error(`ERREUR: Le fichier intents.json n'existe pas: ${intentsFile}`);
        console.error('Le service chatbot ne peut pas démarrer sans ce fichier.');
        return;
    }

    // Utiliser des guillemets pour gérer les espaces et les parenthèses dans le chemin
    const scriptPathQuoted = `"${scriptPath}"`;

    // Construire la commande complète
    const fullCommand = `${pythonCommand} ${scriptPathQuoted} --host=0.0.0.0 --port=5001`;
    console.log(`Exécution de la commande: ${fullCommand}`);

    const chatbotProcess = spawn(fullCommand, [], {
        stdio: 'inherit',
        shell: true,
        cwd: __dirname, // Définir le répertoire de travail actuel
        env: {
            ...process.env,
            PYTHONUNBUFFERED: '1' // Pour voir les logs Python en temps réel
        }
    });

    chatbotProcess.on('error', (error) => {
        console.error(`Erreur lors du démarrage du service chatbot: ${error.message}`);
    });

    chatbotProcess.on('close', (code) => {
        if (code !== 0) {
            console.log(`Le service chatbot s'est arrêté avec le code: ${code}`);
        }
    });

    // Assurer que le processus Python est terminé lorsque ce script se termine
    process.on('exit', () => {
        try {
            chatbotProcess.kill();
        } catch (e) {
            console.log('Le processus chatbot était déjà terminé');
        }
    });

    // Capturer les signaux pour arrêter proprement
    ['SIGINT', 'SIGTERM'].forEach(signal => {
        process.on(signal, () => {
            try {
                chatbotProcess.kill();
            } catch (e) {
                console.log('Le processus chatbot était déjà terminé');
            }
            process.exit(0);
        });
    });

    // Vérifier si le service est accessible après quelques secondes
    setTimeout(() => {
        const http = require('http');
        const req = http.get('http://127.0.0.1:5001/health', (res) => {
            console.log(`Service chatbot accessible: ${res.statusCode}`);
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log(`Réponse du service chatbot: ${data}`);
            });
        });

        req.on('error', (error) => {
            console.error(`ERREUR: Le service chatbot n'est pas accessible: ${error.message}`);
            console.error('Vérifiez les logs pour plus de détails.');
        });

        req.end();
    }, 10000);
}

// Démarrer le serveur Node.js
function startNodeServer() {
    const nodemon = require('nodemon');

    nodemon({
        script: 'app.js',
        ext: 'js json'
    });

    nodemon.on('start', () => {
        console.log('Serveur Node.js démarré');
    });

    nodemon.on('crash', () => {
        console.log('Le serveur Node.js a planté. Redémarrage...');
    });
}

// Démarrer les deux services
startChatbotService();
startNodeServer();
