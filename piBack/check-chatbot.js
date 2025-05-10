const http = require('http');

console.log('Vérification de l\'accessibilité du service chatbot...');

// Essayer d'abord avec 127.0.0.1
console.log('Tentative de connexion via 127.0.0.1:5001...');
const req1 = http.get('http://127.0.0.1:5001/health', (res) => {
    console.log(`Service chatbot accessible via 127.0.0.1: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log(`Réponse du service chatbot: ${data}`);
    });
});

req1.on('error', (error) => {
    console.error(`ERREUR: Le service chatbot n'est pas accessible via 127.0.0.1: ${error.message}`);

    // Essayer avec 51.91.251.228
    console.log('Tentative de connexion via 51.91.251.228:5001...');
    const req2 = http.get('http://51.91.251.228:5000/health', (res) => {
        console.log(`Service chatbot accessible via 51.91.251.228: ${res.statusCode}`);
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            console.log(`Réponse du service chatbot: ${data}`);
        });
    });

    req2.on('error', (error) => {
        console.error(`ERREUR: Le service chatbot n'est pas accessible via 51.91.251.228: ${error.message}`);
        console.error('Vérifiez que le service est bien démarré avec la commande:');
        console.error('python scripts/chatbot_service.py --host=0.0.0.0 --port=5000');
    });

    req2.end();
});

req1.end();
