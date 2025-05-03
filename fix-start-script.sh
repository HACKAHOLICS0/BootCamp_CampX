#!/bin/bash

echo "Modifying start.sh in the container to use node instead of nodemon..."

# Créer un script temporaire avec la modification
cat > temp-fix.sh << 'EOF'
#!/bin/bash
# Script pour modifier le fichier start.sh dans le conteneur
sed -i 's/PORT=5000 nodemon app/PORT=5000 node app.js/g' /app/start.sh
echo "Start script modified successfully!"
EOF

# Copier le script dans le conteneur
docker cp temp-fix.sh campx-app:/tmp/fix.sh

# Rendre le script exécutable et l'exécuter dans le conteneur
docker exec campx-app chmod +x /tmp/fix.sh
docker exec campx-app /tmp/fix.sh

# Nettoyer
rm temp-fix.sh

echo "Redémarrage du conteneur pour appliquer les modifications..."
docker restart campx-app

echo "Attendez quelques instants pour que le conteneur redémarre..."
sleep 10

echo "Affichage des logs pour vérifier le démarrage..."
docker logs campx-app | tail -n 30
