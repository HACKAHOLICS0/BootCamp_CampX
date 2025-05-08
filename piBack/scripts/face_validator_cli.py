import sys
import json
import os
from face_validator import FaceValidator

def main():
    # Rediriger stderr vers un fichier pour le débogage
    error_log = open('python_error.log', 'a')
    sys.stderr = error_log

    # Afficher des informations de débogage
    print(f"Arguments: {sys.argv}", file=sys.stderr)
    print(f"Répertoire courant: {os.getcwd()}", file=sys.stderr)

    # S'assurer que stdout est vide avant de commencer
    sys.stdout.flush()

    # Fonction pour envoyer une réponse JSON valide
    def send_json_response(is_valid, message):
        try:
            # S'assurer que le message est une chaîne valide pour JSON
            if message is None:
                message = ""

            # Échapper les caractères spéciaux dans le message
            message = message.replace('"', '\\"').replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')

            response = {
                "isValid": bool(is_valid),  # Forcer un booléen
                "message": message
            }

            # Utiliser ensure_ascii pour éviter les problèmes d'encodage
            json_str = json.dumps(response, ensure_ascii=True)

            # Enregistrer dans le log pour le débogage
            print(f"Envoi de la réponse JSON: {json_str}", file=sys.stderr)

            # Envoyer uniquement le JSON à stdout, sans autre texte
            print(json_str, end='')  # Pas de nouvelle ligne à la fin
            sys.stdout.flush()
        except Exception as json_err:
            print(f"Erreur lors de la création du JSON: {str(json_err)}", file=sys.stderr)

            # Fallback en cas d'erreur de sérialisation JSON
            print('{"isValid":false,"message":"Erreur interne lors de la validation"}', end='')
            sys.stdout.flush()

    # Vérifier les arguments
    if len(sys.argv) != 2:
        send_json_response(False, "Usage: python face_validator_cli.py <image_path>")
        return

    image_path = sys.argv[1]
    print(f"Chemin de l'image: {image_path}", file=sys.stderr)

    # Vérifier si le fichier existe
    if not os.path.exists(image_path):
        print(f"Le fichier n'existe pas: {image_path}", file=sys.stderr)
        send_json_response(False, f"Le fichier image n'existe pas: {image_path}")
        return

    # Afficher des informations sur le fichier
    try:
        file_size = os.path.getsize(image_path)
        print(f"Taille du fichier: {file_size} octets", file=sys.stderr)
        print(f"Le fichier est accessible en lecture: {os.access(image_path, os.R_OK)}", file=sys.stderr)
    except Exception as e:
        print(f"Erreur lors de l'accès au fichier: {str(e)}", file=sys.stderr)

    try:
        validator = FaceValidator()
        is_valid, message = validator.validate_image_file(image_path)
        send_json_response(is_valid, message)
    except Exception as e:
        import traceback
        traceback.print_exc(file=sys.stderr)
        send_json_response(False, f"Erreur lors de la validation: {str(e)}")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        # Capture toutes les exceptions non gérées
        import traceback
        traceback.print_exc(file=sys.stderr)
        print('{"isValid": false, "message": "Erreur critique lors de la validation"}')
        sys.stdout.flush()