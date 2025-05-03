#!/bin/bash

# Créer le dossier pour les modèles
mkdir -p pi/public/models

# URL de base pour les modèles
BASE_URL="https://github.com/justadudewhohacks/face-api.js/raw/master/weights"

# Liste des fichiers de modèles à télécharger
MODEL_FILES=(
    "face_landmark_68_model-shard1.weights"
    "face_landmark_68_tiny_model-shard1.weights"
    "face_recognition_model-shard1.weights"
    "face_recognition_model-shard2.weights"
    "ssd_mobilenetv1_model-shard1.weights"
    "ssd_mobilenetv1_model-shard2.weights"
    "tiny_face_detector_model-shard1.weights"
    "face_landmark_68_model-weights_manifest.json"
    "face_landmark_68_tiny_model-weights_manifest.json"
    "face_recognition_model-weights_manifest.json"
    "ssd_mobilenetv1_model-weights_manifest.json"
    "tiny_face_detector_model-weights_manifest.json"
)

# Télécharger chaque fichier
for file in "${MODEL_FILES[@]}"; do
    echo "Téléchargement de $file..."
    curl -L "$BASE_URL/$file" -o "pi/public/models/$file"
done

echo "Téléchargement des modèles terminé!"
