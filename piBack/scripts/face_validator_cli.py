import sys
import json
from face_validator import FaceValidator

def main():
    if len(sys.argv) != 2:
        print(json.dumps({
            "isValid": False,
            "message": "Usage: python face_validator_cli.py <image_path>"
        }))
        sys.exit(1)

    image_path = sys.argv[1]
    validator = FaceValidator()
    is_valid, message = validator.validate_image_file(image_path)

    # Assurez-vous que la réponse est un JSON valide
    response = {
        "isValid": is_valid,
        "message": message
    }
    
    # Utilisez print pour envoyer la réponse JSON à stdout
    print(json.dumps(response))
    sys.stdout.flush()  # Force l'envoi de la réponse

if __name__ == "__main__":
    main() 