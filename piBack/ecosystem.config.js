module.exports = {
  apps : [{
    name: 'pi-backend',
    script: 'app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }, {
    name: 'pi-chatbot',
    script: './scripts/chatbot_service.py',
    interpreter: 'python',
    args: '--host=0.0.0.0 --port=5000',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      PYTHONUNBUFFERED: 'true'
    },
    env_production: {
      PYTHONUNBUFFERED: 'true'
    }
  }]
};
