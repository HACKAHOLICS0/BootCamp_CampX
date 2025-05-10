# Guide de déploiement en production

Ce document explique comment déployer l'application en production, y compris le service chatbot.

## Prérequis

1. Node.js (v14+)
2. Python 3.7+
3. PM2 (gestionnaire de processus pour Node.js)
4. MongoDB

## Installation des dépendances

### 1. Dépendances Node.js

```bash
npm install
```

### 2. Dépendances Python

```bash
pip install -r requirements.txt
```

### 3. Installation de PM2 (si non installé)

```bash
npm install -g pm2
```

## Options de déploiement

### Option 1 : Déploiement avec PM2 (recommandé)

PM2 est un gestionnaire de processus pour Node.js qui permet de maintenir les applications en vie, de les redémarrer en cas de plantage et de gérer les logs.

1. Démarrer l'application avec PM2 :

```bash
npm run pm2-start
```

2. Pour l'environnement de production :

```bash
npm run pm2-start-prod
```

3. Voir les logs :

```bash
npm run pm2-logs
```

4. Arrêter tous les processus :

```bash
npm run pm2-stop
```

### Option 2 : Déploiement avec le script de production

Ce script démarre à la fois le serveur Node.js et le service Python du chatbot, et les redémarre en cas de plantage.

```bash
npm run start-production
```

Les logs sont écrits dans le dossier `logs/`.

### Option 3 : Déploiement avec Docker (à venir)

Un fichier Dockerfile et docker-compose.yml seront fournis dans une future mise à jour.

## Configuration

### Variables d'environnement

Créez un fichier `.env` dans le dossier `config/` avec les variables suivantes :

```
PORT=5000
CHATBOT_PORT=5001
CHATBOT_HOST=0.0.0.0
MONGODB_URI=mongodb://51.91.251.228:27017/pidb
JWT_SECRET=votre_secret_jwt
```

### Configuration de PM2

Le fichier `ecosystem.config.js` contient la configuration pour PM2. Vous pouvez le modifier selon vos besoins.

## Déploiement sur un serveur

### 1. Cloner le dépôt

```bash
git clone <url_du_depot>
cd piBack
```

### 2. Installer les dépendances

```bash
npm install
pip install -r requirements.txt
```

### 3. Configurer l'environnement

```bash
cp config/.env.example config/.env
# Modifier le fichier .env selon vos besoins
```

### 4. Démarrer l'application

```bash
npm run pm2-start-prod
```

### 5. Configurer PM2 pour démarrer au boot (optionnel)

```bash
pm2 startup
pm2 save
```

## Vérification du déploiement

1. Vérifier que le serveur Node.js est accessible :

```bash
curl http://51.91.251.228:5000/api/health
```

2. Vérifier que le service chatbot est accessible :

```bash
curl http://51.91.251.228:5001/health
```

## Dépannage

### Problèmes courants

1. **Le service chatbot ne démarre pas**
   - Vérifiez les logs dans `logs/chatbot.log`
   - Assurez-vous que Python est correctement installé
   - Vérifiez que toutes les dépendances Python sont installées

2. **Le serveur Node.js ne démarre pas**
   - Vérifiez les logs dans `logs/server.log`
   - Vérifiez la connexion à MongoDB

3. **Erreurs de permission**
   - Assurez-vous que l'utilisateur qui exécute l'application a les permissions nécessaires

### Commandes utiles

- Voir les processus PM2 : `pm2 list`
- Voir les logs en temps réel : `pm2 logs`
- Redémarrer un processus : `pm2 restart <nom_du_processus>`
- Voir les détails d'un processus : `pm2 show <nom_du_processus>`
