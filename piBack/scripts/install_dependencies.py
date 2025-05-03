#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script d'installation des dépendances pour les scripts Python du projet CampX
Ce script installe toutes les bibliothèques nécessaires pour exécuter les scripts Python du projet.
"""

import subprocess
import sys
import os

def install_dependencies():
    """Installe toutes les dépendances nécessaires pour les scripts Python"""
    print("Installation des dépendances pour les scripts Python...")
    
    # Liste des dépendances
    dependencies = [
        # Dépendances générales
        "numpy",
        "pandas",
        "requests",
        "beautifulsoup4",
        "flask",
        "flask-cors",
        "pillow",
        
        # Dépendances pour l'IA et le ML
        "tensorflow",
        "scikit-learn",
        "nltk",
        
        # Dépendances pour le traitement d'images
        "opencv-python",
        
        # Dépendances pour le web scraping
        "selenium",
    ]
    
    # Installation des dépendances
    for dependency in dependencies:
        print(f"Installation de {dependency}...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", dependency])
            print(f"{dependency} installé avec succès.")
        except subprocess.CalledProcessError:
            print(f"Erreur lors de l'installation de {dependency}.")
    
    # Téléchargement des ressources NLTK
    print("Téléchargement des ressources NLTK...")
    try:
        import nltk
        nltk.download('punkt')
        nltk.download('wordnet')
        nltk.download('stopwords')
        print("Ressources NLTK téléchargées avec succès.")
    except Exception as e:
        print(f"Erreur lors du téléchargement des ressources NLTK: {e}")
    
    # Création des dossiers nécessaires
    print("Création des dossiers nécessaires...")
    folders = [
        "../models",
        "../data/market_insights",
        "../logs",
        "../uploads/videos"
    ]
    
    for folder in folders:
        folder_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), folder)
        os.makedirs(folder_path, exist_ok=True)
        print(f"Dossier {folder_path} créé.")
    
    print("\nInstallation des dépendances terminée.")
    print("Vous pouvez maintenant exécuter les scripts Python du projet.")

if __name__ == "__main__":
    install_dependencies()
