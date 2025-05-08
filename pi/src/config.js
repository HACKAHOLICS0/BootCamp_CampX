// API URLs and other configuration
const config = {
    API_URL: 'http://51.91.251.228:5000',  // Utiliser HTTPS en production
    apiBaseUrl: 'http://51.91.251.228:5000/api',  // Utiliser HTTPS en production
    stripePublicKey: process.env.REACT_APP_STRIPE_PUBLIC_KEY,
    paymentApiUrl: 'http://51.91.251.228:5000/api/payments',  // Utiliser HTTPS
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
