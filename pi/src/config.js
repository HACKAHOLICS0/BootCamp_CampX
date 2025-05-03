// API URLs and other configuration
const config = {
    API_URL: window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`,
    endpoints: {
        courses: '/api/courses',
        quizzes: '/api/quiz',
        modules: '/api/module',
        categories: '/api/category',
        users: '/api/user'
    }
};

export default config;