const { spawn } = require('child_process');
const os = require('os');

// Démarrer le service Python du chatbot
function startChatbotService() {
    // Utiliser le script Node.js dédié au chatbot
    console.log('Démarrage du service chatbot via le script Node.js dédié...');

    const nodeChatbotProcess = spawn('node', ['start-chatbot.js'], {
        stdio: 'inherit',
        shell: true,
        cwd: __dirname
    });

    nodeChatbotProcess.on('error', (error) => {
        console.error(`Erreur lors du démarrage du service chatbot: ${error.message}`);
    });

    nodeChatbotProcess.on('close', (code) => {
        if (code !== 0) {
            console.log(`Le service chatbot s'est arrêté avec le code: ${code}`);
        }
    });

    // Assurer que le processus est terminé lorsque ce script se termine
    process.on('exit', () => {
        try {
            nodeChatbotProcess.kill();
        } catch (e) {
            console.log('Le processus chatbot était déjà terminé');
        }
    });

    // Capturer les signaux pour arrêter proprement
    ['SIGINT', 'SIGTERM'].forEach(signal => {
        process.on(signal, () => {
            try {
                nodeChatbotProcess.kill();
            } catch (e) {
                console.log('Le processus chatbot était déjà terminé');
            }
            process.exit(0);
        });
    });
}

// Démarrer le serveur Node.js et le frontend React
function startDevEnvironment() {
    const npmCommand = os.platform() === 'win32' ? 'npm.cmd' : 'npm';

    console.log('Démarrage de l\'environnement de développement...');

    const devProcess = spawn(npmCommand, ['run', 'dev'], {
        stdio: 'inherit',
        shell: true
    });

    devProcess.on('error', (error) => {
        console.error(`Erreur lors du démarrage de l'environnement de développement: ${error.message}`);
    });

    devProcess.on('close', (code) => {
        if (code !== 0) {
            console.log(`L'environnement de développement s'est arrêté avec le code: ${code}`);
        }
    });
}

// Démarrer tous les services
console.log('Démarrage de tous les services...');
startChatbotService();
startDevEnvironment();
