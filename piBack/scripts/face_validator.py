import cv2
import numpy as np
import os
from PIL import Image
import io

class FaceValidator:
    def __init__(self):
        # Load the pre-trained face detection model
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
    def validate_image(self, image_data):
        try:
            # Convert image data to numpy array
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            
            # Check if any face was detected
            if len(faces) > 0:
                return True, "Image validée avec succès"
            else:
                return False, "Aucun visage détecté. Veuillez télécharger une image contenant votre visage."
                
        except Exception as e:
            return False, f"Erreur lors de la validation de l'image: {str(e)}"
    
    def validate_image_file(self, image_path):
        try:
            # Read the image file
            img = cv2.imread(image_path)
            if img is None:
                return False, "Impossible de lire l'image"
            
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            
            # Check if any face was detected
            if len(faces) > 0:
                return True, "Image validée avec succès"
            else:
                return False, "Aucun visage détecté. Veuillez télécharger une image contenant votre visage."
                
        except Exception as e:
            return False, f"Erreur lors de la validation de l'image: {str(e)}" 