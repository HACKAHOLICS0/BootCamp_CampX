#!/bin/bash

# Installer Python et pip
apt-get update
apt-get install -y python3 python3-pip python3-venv

# Créer un environnement virtuel
python3 -m venv /app/piBack/venv

# Activer l'environnement virtuel
source /app/piBack/venv/bin/activate

# Installer les dépendances Python
pip install openai-whisper
pip install numpy
pip install pandas
pip install scikit-learn
pip install tensorflow
pip install nltk
pip install transformers
pip install torch
pip install flask

# Télécharger les modèles NLTK
python3 -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('wordnet')"

echo "Installation des dépendances Python terminée!"
