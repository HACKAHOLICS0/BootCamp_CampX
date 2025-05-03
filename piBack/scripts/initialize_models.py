#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script d'initialisation des modèles pour les scripts Python du projet CampX
Ce script télécharge et initialise tous les modèles nécessaires pour les scripts Python.
"""

import os
import sys
import json
import urllib.request
import shutil
import zipfile
import tarfile
import nltk
import cv2
import tensorflow as tf
from tensorflow.keras.models import load_model
import numpy as np

def initialize_models():
    """Initialise tous les modèles nécessaires pour les scripts Python"""
    print("Initialisation des modèles pour les scripts Python...")
    
    # Chemin vers le dossier des modèles
    models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../models')
    os.makedirs(models_dir, exist_ok=True)
    
    # Téléchargement des ressources NLTK
    print("Téléchargement des ressources NLTK...")
    try:
        nltk.download('punkt')
        nltk.download('wordnet')
        nltk.download('stopwords')
        print("Ressources NLTK téléchargées avec succès.")
    except Exception as e:
        print(f"Erreur lors du téléchargement des ressources NLTK: {e}")
    
    # Vérification du modèle de détection de visage OpenCV
    print("Vérification du modèle de détection de visage OpenCV...")
    try:
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        if face_cascade.empty():
            print("Erreur: Le modèle de détection de visage OpenCV n'a pas pu être chargé.")
        else:
            print("Modèle de détection de visage OpenCV chargé avec succès.")
    except Exception as e:
        print(f"Erreur lors de la vérification du modèle de détection de visage OpenCV: {e}")
    
    # Vérification du modèle de chatbot
    chatbot_model_path = os.path.join(models_dir, 'chatbot_model.h5')
    if not os.path.exists(chatbot_model_path):
        print("Le modèle de chatbot n'existe pas. Vous devez l'entraîner avec train_model.py.")
    else:
        print("Vérification du modèle de chatbot...")
        try:
            model = load_model(chatbot_model_path)
            print("Modèle de chatbot chargé avec succès.")
        except Exception as e:
            print(f"Erreur lors du chargement du modèle de chatbot: {e}")
    
    print("\nInitialisation des modèles terminée.")
    print("Vous pouvez maintenant exécuter les scripts Python du projet.")

if __name__ == "__main__":
    initialize_models()
