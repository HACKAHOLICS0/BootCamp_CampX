const config = {
    apiBaseUrl: process.env.REACT_APP_API_URL || 'http://localhost:5002/api',
    recaptchaSiteKey: process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LfHQJIpAAAAAFRXz0nNU-XBauXYpJBnSzQQEPQP'
};

// Afficher la configuration pour le débogage
console.log('API Base URL:', config.apiBaseUrl);

export default config;