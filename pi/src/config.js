// API URLs and other configuration
const config = {
    API_URL: 'https://ikramsegni.fr',  // Utiliser HTTPS en production
    apiBaseUrl: 'https://ikramsegni.fr/api',  // Utiliser HTTPS en production
    stripePublicKey: process.env.REACT_APP_STRIPE_PUBLIC_KEY,
    paymentApiUrl: 'https://ikramsegni.fr/api/payments',  // Utiliser HTTPS
    websocketUrl: 'wss://ikramsegni.fr/ws',  // Ajout de l'URL WebSocket sans port spécifique
    endpoints: {
        courses: '/api/courses',
        quizzes: '/api/quiz',
        modules: '/api/module',
        categories: '/api/category',
        users: '/api/user',
        payments: '/api/payments',
        chat: '/api/chat',
        events: '/api/events',
        certificates: '/api/certificates'
    }
};

export default config;
