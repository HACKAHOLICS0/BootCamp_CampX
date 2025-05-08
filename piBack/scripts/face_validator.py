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
            # Rediriger tous les prints vers stderr pour le débogage
            import sys

            # Fonction pour logger sans affecter stdout
            def log(message):
                print(message, file=sys.stderr)

            log(f"Tentative de lecture de l'image: {image_path}")

            # Vérifier si le fichier existe
            import os
            if not os.path.exists(image_path):
                log(f"Le fichier n'existe pas: {image_path}")
                return False, "Le fichier image n'existe pas"

            # Afficher la taille du fichier pour le débogage
            file_size = os.path.getsize(image_path)
            log(f"Taille du fichier: {file_size} octets")

            # Essayer de lire l'image avec PIL d'abord
            try:
                from PIL import Image
                pil_img = Image.open(image_path)
                log(f"Image lue avec PIL: {pil_img.size}")
                # Convertir l'image PIL en format OpenCV
                import numpy as np
                img = np.array(pil_img.convert('RGB'))
                # Convertir de RGB à BGR (format OpenCV)
                img = img[:, :, ::-1].copy()
            except Exception as pil_error:
                log(f"Erreur lors de la lecture avec PIL: {str(pil_error)}")
                # Si PIL échoue, essayer avec OpenCV directement
                img = cv2.imread(image_path)

            # Vérifier si l'image a été correctement chargée
            if img is None:
                log("L'image n'a pas pu être lue avec OpenCV ni PIL")
                return False, "Impossible de lire l'image. Veuillez essayer un autre format (JPG, PNG)."

            # Afficher les dimensions de l'image pour le débogage
            log(f"Dimensions de l'image: {img.shape}")

            # Convertir en niveaux de gris
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            # Essayer différents paramètres pour la détection de visage
            detection_params = [
                # Paramètres standard
                {"scaleFactor": 1.1, "minNeighbors": 5, "minSize": (30, 30)},
                # Paramètres plus tolérants
                {"scaleFactor": 1.2, "minNeighbors": 3, "minSize": (20, 20)},
                # Paramètres très tolérants
                {"scaleFactor": 1.3, "minNeighbors": 2, "minSize": (10, 10)}
            ]

            for params in detection_params:
                faces = self.face_cascade.detectMultiScale(
                    gray,
                    scaleFactor=params["scaleFactor"],
                    minNeighbors=params["minNeighbors"],
                    minSize=params["minSize"]
                )

                log(f"Tentative avec params {params}: {len(faces)} visages détectés")

                if len(faces) > 0:
                    return True, "Image validée avec succès"

            # Si aucun visage n'est détecté après toutes les tentatives
            return False, "Aucun visage détecté. Veuillez télécharger une image contenant clairement votre visage."

        except Exception as e:
            log(f"Erreur dans la validation faciale: {str(e)}")
            import traceback
            traceback.print_exc(file=sys.stderr)
            return False, f"Erreur lors de la validation de l'image: {str(e)}"