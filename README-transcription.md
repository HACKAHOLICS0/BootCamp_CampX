# Transcription Vidéo avec Google Speech-to-Text

Ce projet utilise l'API Google Speech-to-Text pour transcrire en temps réel l'audio des vidéos. Voici comment configurer et utiliser cette fonctionnalité.

## Configuration

### 1. Créer un compte Google Cloud

1. Rendez-vous sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un compte si vous n'en avez pas déjà un
3. Créez un nouveau projet

### 2. Activer l'API Speech-to-Text

1. Dans la console Google Cloud, accédez à "APIs & Services" > "Library"
2. Recherchez "Speech-to-Text API" et activez-la pour votre projet

### 3. Créer des identifiants

1. Accédez à "APIs & Services" > "Credentials"
2. Cliquez sur "Create Credentials" > "Service Account"
3. Donnez un nom à votre compte de service et accordez-lui le rôle "Speech-to-Text Admin"
4. Créez une clé pour ce compte de service au format JSON
5. Téléchargez le fichier JSON

### 4. Configurer le projet

#### Option 1 : Utiliser un fichier de configuration

1. Renommez le fichier JSON téléchargé en `google-credentials.json`
2. Placez-le dans le dossier `piBack/config/`

#### Option 2 : Utiliser une variable d'environnement

Définissez la variable d'environnement `GOOGLE_APPLICATION_CREDENTIALS` qui pointe vers le chemin complet du fichier de clé :

```bash
# Sur Windows
set GOOGLE_APPLICATION_CREDENTIALS=C:\chemin\vers\votre-fichier-de-cle.json

# Sur Linux/Mac
export GOOGLE_APPLICATION_CREDENTIALS=/chemin/vers/votre-fichier-de-cle.json
```

## Utilisation

Une fois configuré, le système de transcription fonctionnera automatiquement lorsque vous regardez une vidéo. Voici comment cela fonctionne :

1. Lorsque vous lancez une vidéo, le système capture l'audio
2. Toutes les 5 secondes, l'audio capturé est envoyé à Google Speech-to-Text
3. La transcription est affichée en temps réel sous la vidéo
4. Un badge "TRANSCRIPTION RÉELLE" indique que vous utilisez la véritable transcription

## Mode de secours

Si Google Speech-to-Text n'est pas configuré ou rencontre une erreur, le système basculera automatiquement en mode de secours :

1. Un badge "MODE DE SECOURS" s'affichera
2. Des transcriptions génériques seront utilisées à la place
3. Pour revenir à la transcription réelle, configurez correctement l'API Google Speech-to-Text

## Dépannage

### La transcription n'apparaît pas

- Vérifiez que votre navigateur prend en charge l'API Web Audio et MediaRecorder
- Assurez-vous que la vidéo a bien du son
- Vérifiez les logs du serveur pour détecter d'éventuelles erreurs

### Erreur d'authentification Google

- Vérifiez que le fichier de clé est correctement placé
- Assurez-vous que l'API Speech-to-Text est bien activée
- Vérifiez que la clé a les permissions nécessaires

### Transcription de mauvaise qualité

- Essayez d'améliorer la qualité audio de la vidéo
- Vérifiez que la langue configurée correspond à celle parlée dans la vidéo
- Google Speech-to-Text fonctionne mieux avec un audio clair et sans bruit de fond
