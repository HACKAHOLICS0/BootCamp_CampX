# Configuration Google Cloud

Pour utiliser l'API Google Speech-to-Text, vous devez :

1. Créer un compte Google Cloud Platform (https://cloud.google.com/)
2. Créer un nouveau projet
3. Activer l'API Speech-to-Text pour ce projet
4. Créer une clé de compte de service avec les droits nécessaires
5. Télécharger le fichier JSON de clé et le renommer en `google-credentials.json`
6. Placer ce fichier dans ce répertoire

## Alternative : Utiliser une variable d'environnement

Au lieu de placer le fichier de clé ici, vous pouvez définir la variable d'environnement `GOOGLE_APPLICATION_CREDENTIALS` qui pointe vers le chemin complet du fichier de clé.

```
# Sur Windows
set GOOGLE_APPLICATION_CREDENTIALS=C:\chemin\vers\votre-fichier-de-cle.json

# Sur Linux/Mac
export GOOGLE_APPLICATION_CREDENTIALS=/chemin/vers/votre-fichier-de-cle.json
```

## Sécurité

Ne partagez jamais vos clés d'API et ne les incluez pas dans le contrôle de version. Assurez-vous que le fichier `.gitignore` exclut les fichiers de clés.
