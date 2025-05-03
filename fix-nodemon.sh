#!/bin/bash

# Script pour installer nodemon globalement et redémarrer le backend
echo "Installation de nodemon globalement..."
docker exec -it campx-app npm install -g nodemon

echo "Redémarrage du backend..."
docker exec -it campx-app bash -c "cd /app/piBack && PORT=5000 nodemon app &"

echo "Installation terminée. Le backend devrait maintenant démarrer correctement."
