#!/bin/bash

# Arrêter le conteneur actuel
echo "Arrêt du conteneur actuel..."
docker stop campx-app

# Redémarrer le conteneur avec une commande modifiée
echo "Redémarrage du conteneur avec node au lieu de nodemon..."
docker start campx-app

# Exécuter node directement au lieu de nodemon
echo "Démarrage du backend avec node..."
docker exec -it campx-app bash -c "cd /app/piBack && PORT=5000 node app.js &"

echo "Le backend devrait maintenant démarrer correctement avec node au lieu de nodemon."
