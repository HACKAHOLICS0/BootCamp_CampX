#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de secours pour la validation de visage
Ce script tente d'utiliser face_recognition, mais utilise OpenCV comme solution de secours
"""

import os
import sys
import json

def validate_with_face_recognition(image_path):
    """Tente de valider l'image avec face_recognition"""
    try:
        import face_recognition
        
        # Charger l'image
        image = face_recognition.load_image_file(image_path)
        
        # Détecter les visages
        face_locations = face_recognition.face_locations(image)
        
        # Si aucun visage n'est détecté
        if len(face_locations) == 0:
            return {
                "valid": False,
                "message": "Aucun visage détecté dans l'image",
                "faces": 0,
                "confidence": 0.0
            }
        
        # Si plusieurs visages sont détectés
        if len(face_locations) > 1:
            return {
                "valid": False,
                "message": f"{len(face_locations)} visages détectés dans l'image. Une seule personne est autorisée.",
                "faces": len(face_locations),
                "confidence": 0.95
            }
        
        # Un seul visage détecté
        return {
            "valid": True,
            "message": "Visage valide détecté avec face_recognition",
            "faces": 1,
            "confidence": 0.95
        }
    except Exception as e:
        print(f"Erreur avec face_recognition: {str(e)}", file=sys.stderr)
        return None

def validate_with_opencv(image_path):
    """Valide l'image avec OpenCV comme solution de secours"""
    try:
        # Importer le module de validation OpenCV
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from face_validator_opencv import validate_face
        
        # Valider l'image
        return validate_face(image_path)
    except Exception as e:
        print(f"Erreur avec OpenCV: {str(e)}", file=sys.stderr)
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
            "message": "Usage: python face_validator_cli_fallback.py <image_path>",
            "faces": 0,
            "confidence": 0.0
        }))
        sys.exit(1)
    
    # Récupérer le chemin de l'image
    image_path = sys.argv[1]
    
    # Vérifier si le fichier existe
    if not os.path.exists(image_path):
        print(json.dumps({
            "valid": False,
            "message": f"Le fichier {image_path} n'existe pas",
            "faces": 0,
            "confidence": 0.0
        }))
        sys.exit(1)
    
    # Essayer d'abord avec face_recognition
    result = validate_with_face_recognition(image_path)
    
    # Si face_recognition échoue, utiliser OpenCV
    if result is None:
        print("Utilisation d'OpenCV comme solution de secours", file=sys.stderr)
        result = validate_with_opencv(image_path)
    
    # Afficher le résultat au format JSON
    print(json.dumps(result))
