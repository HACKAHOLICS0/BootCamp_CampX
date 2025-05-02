# Configuration de l'API YouTube

Pour utiliser l'API YouTube Data v3 et rechercher des vidéos, vous devez :

1. Créer un compte Google Cloud Platform (https://cloud.google.com/)
2. Créer un nouveau projet
3. Activer l'API YouTube Data v3 pour ce projet
4. Créer une clé API
5. Ajouter cette clé dans le fichier `.env` sous la variable `YOUTUBE_API_KEY`

## Étapes détaillées

### 1. Créer un compte Google Cloud Platform

Si vous n'avez pas encore de compte Google Cloud Platform, rendez-vous sur https://cloud.google.com/ et créez-en un.

### 2. Créer un nouveau projet

1. Accédez à la console Google Cloud Platform
2. Cliquez sur le sélecteur de projet en haut de la page
3. Cliquez sur "Nouveau projet"
4. Donnez un nom à votre projet et cliquez sur "Créer"

### 3. Activer l'API YouTube Data v3

1. Dans le menu de navigation, allez dans "APIs & Services" > "Library"
2. Recherchez "YouTube Data API v3"
3. Cliquez sur l'API dans les résultats de recherche
4. Cliquez sur "Activer"

### 4. Créer une clé API

1. Dans le menu de navigation, allez dans "APIs & Services" > "Credentials"
2. Cliquez sur "Create Credentials" > "API key"
3. Une nouvelle clé API sera créée. Copiez cette clé.

### 5. Configurer le projet

Ajoutez votre clé API YouTube dans le fichier `.env` :

```
YOUTUBE_API_KEY=votre_clé_api_ici
```

## Quotas et limites

L'API YouTube Data v3 a des quotas quotidiens :

- Par défaut, vous disposez de 10 000 unités par jour
- Chaque requête de recherche coûte 100 unités
- Chaque requête de détails vidéo coûte 1 unité par vidéo

Cela signifie que vous pouvez effectuer environ 100 recherches par jour avec le quota par défaut.

## Mode de secours

Si la clé API n'est pas configurée ou si le quota est dépassé, le système basculera automatiquement vers des données statiques prédéfinies pour les recommandations de vidéos.

## Sécurité

Ne partagez jamais votre clé API et ne l'incluez pas dans le contrôle de version. Assurez-vous que le fichier `.env` est inclus dans `.gitignore`.
