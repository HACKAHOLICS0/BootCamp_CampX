#!/bin/bash

# Startup script for CampX application
echo "Starting CampX application..."

# Créer les dossiers nécessaires s'ils n'existent pas
echo "Creating necessary directories..."
mkdir -p /app/piBack/uploads/videos
mkdir -p /app/piBack/uploads/images
mkdir -p /app/piBack/data/market_insights
mkdir -p /app/piBack/public
mkdir -p /app/piBack/models
mkdir -p /app/piBack/logs

# Donner les permissions nécessaires
echo "Setting permissions..."
chmod -R 777 /app/piBack/uploads
chmod -R 777 /app/piBack/public

# Vérifier que Python est installé correctement
echo "Checking Python installation..."
python3 --version

# Configurer l'environnement Python
echo "Configuring Python environment..."
export PATH="/opt/cmake/bin:${PATH}"
export PYTHONPATH="/app/piBack/python_packages:/usr/local/lib/python3.9/dist-packages:$PYTHONPATH"
export NLTK_DATA="/app/piBack/python_packages/nltk_data"

# Vérifier que CMake est correctement installé
echo "Checking CMake installation..."
cmake --version || echo "CMake not installed properly"

# Vérifier que les modules Python nécessaires sont installés
echo "Checking Python modules..."
python3 -c "import sys; print('Python path:', sys.path)"
python3 -c "import cv2; print('OpenCV version:', cv2.__version__)" || echo "OpenCV not installed properly"
python3 -c "import dlib; print('dlib version:', dlib.__version__)" || echo "dlib not installed properly"
python3 -c "import face_recognition; print('face_recognition imported successfully')" || echo "face_recognition not installed properly"
python3 -c "import nltk; print('NLTK imported successfully')" || echo "NLTK not installed properly"

# Créer un lien symbolique pour dlib si nécessaire
if [ ! -d "/app/piBack/python_packages/dlib" ]; then
  echo "Creating symbolic link for dlib..."
  ln -sf /usr/local/lib/python3.*/dist-packages/dlib* /app/piBack/python_packages/ || echo "dlib link failed, but continuing"
fi

# Check if we are in development or production mode
if [ "$NODE_ENV" = "development" ] || [ "$NODE_ENV" = "" ]; then
  echo "Development mode activated"

  # Vérifier les variables d'environnement
  echo "Checking environment variables..."
  if [ -z "$MONGODB_URI" ] && [ -z "$MONGO_URI" ]; then
    echo "Warning: MONGODB_URI and MONGO_URI are not set. Using default MongoDB URI."
  else
    echo "MongoDB URI is set."
  fi

  if [ -z "$JWT_SECRET" ]; then
    echo "Warning: JWT_SECRET is not set. Using default value."
    export JWT_SECRET="fallback_jwt_secret_for_development"
  fi

  if [ -z "$SESSION_SECRET" ]; then
    echo "Warning: SESSION_SECRET is not set. Using default value."
    export SESSION_SECRET="fallback_session_secret_for_development"
  fi

  # Start the backend directly
  cd /app/piBack
  echo "Starting backend on port 5000..."
  PORT=5000 node app.js &

  # Attendre que le backend démarre
  echo "Waiting for backend to start..."

  # Fonction pour vérifier si le backend est en cours d'exécution
  check_backend() {
    curl -s http://localhost:5000/health > /dev/null
    return $?
  }

  # Attendre jusqu'à 60 secondes que le backend démarre
  echo "Waiting up to 60 seconds for backend to start..."
  for i in {1..12}; do
    if check_backend; then
      echo "✅ Backend is running successfully!"
      break
    else
      echo "Attempt $i: Backend not ready yet, waiting 5 more seconds..."
      sleep 5
    fi

    if [ $i -eq 12 ]; then
      echo "⚠️ Warning: Backend may not be fully started yet, but continuing anyway..."
    fi
  done

  # Vérifier la connexion à MongoDB
  echo "Checking MongoDB connection..."
  if curl -s http://localhost:5000/api/health | grep -q "ok"; then
    echo "✅ MongoDB connection successful!"
  else
    echo "⚠️ Warning: MongoDB connection may not be established."
  fi

  # Start the frontend directly
  cd /app/pi
  echo "Starting frontend on port 3000..."
  PORT=3000 npm start
else
  echo "Production mode activated"

  # In production, we use the frontend build served by the backend
  cd /app && npm start
fi
