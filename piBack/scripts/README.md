# Détection de fraude pour les quiz

Ce dossier contient les scripts Python pour la détection de fraude pendant les quiz.

## Installation

### Prérequis

- Python 3.7 ou supérieur
- pip (gestionnaire de paquets Python)

### Dépendances

```bash
pip install flask dlib opencv-python numpy
```

Note: L'installation de dlib peut nécessiter CMake et un compilateur C++. Voir les instructions ci-dessous.

#### Installation de dlib sur Windows

1. Installer Visual Studio Build Tools avec le workload "Desktop development with C++"
2. Installer CMake depuis https://cmake.org/download/
3. Installer dlib avec pip:
   ```bash
   pip install dlib
   ```

#### Installation de dlib sur Linux

```bash
sudo apt-get update
sudo apt-get install -y build-essential cmake
pip install dlib
```

#### Installation de dlib sur macOS

```bash
brew install cmake
pip install dlib
```

### Téléchargement du modèle

Exécutez le script `download_model.py` pour télécharger le modèle de détection de visage:

```bash
python download_model.py
```

## Utilisation

### Démarrer l'API de détection de fraude

#### Windows

```bash
cd piBack
start_fraud_detection_api.bat
```

#### Linux/macOS

```bash
cd piBack
chmod +x start_fraud_detection_api.sh
./start_fraud_detection_api.sh
```

L'API sera disponible à l'adresse http://localhost:5001.

### Endpoints de l'API

- `POST /api/detect-fraud`: Détecte la fraude à partir d'une image base64
  - Corps de la requête: `{ "image": "data:image/jpeg;base64,..." }`
  - Réponse: `{ "fraud_detected": true/false, "fraud_type": "...", "details": "...", "confidence": 0.95, "timestamp": 1234567890 }`

- `GET /api/health`: Vérifie l'état de l'API
  - Réponse: `{ "status": "ok", "timestamp": 1234567890 }`

## Analyse de vidéos

Pour analyser une vidéo complète (par exemple, pour vérifier une vidéo enregistrée pendant un quiz):

```bash
python fraud_detection.py chemin/vers/video.mp4 chemin/vers/resultats.json
```

Options:
- `--sample-rate`: Nombre d'images à analyser par seconde (par défaut: 1)

## Intégration avec l'application web

Le composant React `VideoSurveillance.js` communique avec cette API pour détecter la fraude en temps réel pendant les quiz.
