// API URLs and other configuration
const config = {
    API_URL: 'http://localhost:5000',  // URL du serveur backend
    endpoints: {
        courses: '/api/courses',
        quizzes: '/api/quiz',
        modules: '/api/module',
        categories: '/api/category',
        users: '/api/user',
        generateQuestion: '/api/generate-question',
        analyzeVideo: '/api/analyze-video',
        videoTranscription: '/api/video-transcription'
    }
};

export default config;
