#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script alternatif pour la validation de visage utilisant OpenCV
Ce script peut être utilisé comme solution de secours si face_recognition ne fonctionne pas
"""

import os
import sys
import json
import cv2
import numpy as np

def validate_face(image_path):
    """
    Valide si l'image contient un visage humain en utilisant OpenCV
    
    Args:
        image_path (str): Chemin vers l'image à valider
        
    Returns:
        dict: Résultat de la validation
    """
    try:
        # Vérifier si le fichier existe
        if not os.path.exists(image_path):
            return {
                "valid": False,
                "message": f"Le fichier {image_path} n'existe pas",
                "faces": 0,
                "confidence": 0.0
            }
        
        # Charger l'image
        img = cv2.imread(image_path)
        if img is None:
            return {
                "valid": False,
                "message": f"Impossible de charger l'image {image_path}",
                "faces": 0,
                "confidence": 0.0
            }
        
        # Convertir l'image en niveaux de gris
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Charger le classificateur en cascade pour la détection de visage
        face_cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        if not os.path.exists(face_cascade_path):
            return {
                "valid": False,
                "message": "Classificateur de visage non trouvé",
                "faces": 0,
                "confidence": 0.0
            }
            
        face_cascade = cv2.CascadeClassifier(face_cascade_path)
        
        # Détecter les visages
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        # Si aucun visage n'est détecté
        if len(faces) == 0:
            return {
                "valid": False,
                "message": "Aucun visage détecté dans l'image",
                "faces": 0,
                "confidence": 0.0
            }
        
        # Si plusieurs visages sont détectés
        if len(faces) > 1:
            return {
                "valid": False,
                "message": f"{len(faces)} visages détectés dans l'image. Une seule personne est autorisée.",
                "faces": len(faces),
                "confidence": 0.8
            }
        
        # Un seul visage détecté
        return {
            "valid": True,
            "message": "Visage valide détecté",
            "faces": 1,
            "confidence": 0.9
        }
            
    except Exception as e:
        return {
            "valid": False,
            "message": f"Erreur lors de la validation de l'image: {str(e)}",
            "faces": 0,
            "confidence": 0.0
        }

if __name__ == "__main__":
    # Vérifier les arguments
    if len(sys.argv) < 2:
        print(json.dumps({
            "valid": False,
            "message": "Usage: python face_validator_opencv.py <image_path>",
            "faces": 0,
            "confidence": 0.0
        }))
        sys.exit(1)
    
    # Valider l'image
    image_path = sys.argv[1]
    result = validate_face(image_path)
    
    # Afficher le résultat au format JSON
    print(json.dumps(result))
