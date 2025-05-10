# Guide d'utilisation du Chatbot IA

Ce document explique comment lancer et utiliser le chatbot IA intégré à l'application.

> **Note pour le déploiement en production** : Pour les instructions de déploiement en environnement de production, consultez le fichier [DEPLOYMENT.md](./DEPLOYMENT.md).

## Prérequis

1. Node.js et npm installés
2. Python 3.7+ installé
3. Dépendances Python installées

## Installation des dépendances Python

Avant de lancer le chatbot, assurez-vous d'avoir installé toutes les dépendances Python nécessaires :

```bash
pip install -r requirements.txt
```

Vous pouvez vérifier que toutes les dépendances sont correctement installées avec :

```bash
npm run check-python-deps
```

## Lancement du chatbot

### Option 1 : Lancement de tous les services en une seule commande

Pour lancer à la fois le frontend React, le backend Node.js et le service Python du chatbot :

```bash
# Avec Node.js
npm run start-all

# Avec un script batch (Windows, recommandé)
npm run start-all-bat
```

### Option 2 : Lancement automatique avec le serveur Node.js

Pour lancer à la fois le serveur Node.js et le service Python du chatbot :

```bash
npm run dev-with-chatbot
```

Cette commande lancera :
- Le frontend React sur le port 3000
- Le backend Node.js sur le port 5000
- Le service Python du chatbot sur le port 5001

### Option 3 : Lancement manuel du chatbot

Si vous préférez lancer le chatbot séparément :

1. Lancez le serveur Node.js normalement :
```bash
npm run dev
```

2. Dans un autre terminal, lancez le service Python du chatbot :
```bash
# Avec le script batch (Windows)
npm run start-chatbot

# Avec le script Node.js (plus fiable avec les chemins contenant des espaces)
npm run start-chatbot-node

# Avec le script PowerShell (Windows, recommandé)
npm run start-chatbot-ps

# Ou directement avec Python
python scripts/chatbot_service.py --host=0.0.0.0 --port=5001
```

## Vérification du fonctionnement

Pour vérifier que le service chatbot fonctionne correctement :

```bash
npm run check-chatbot
```

Ou accédez directement à :
```
http://51.91.251.228:5001/health
```

Vous devriez voir une réponse JSON indiquant que le service est en bonne santé.

## Entraînement du modèle

Pour entraîner ou ré-entraîner le modèle du chatbot :

```bash
python scripts/train_model.py
```

Ou via l'API (réservé aux administrateurs) :
```
POST http://51.91.251.228:5000/api/chat/train-model
```

## Dépannage

Si le chatbot ne démarre pas correctement :

1. Vérifiez que Python est correctement installé et accessible dans le PATH
   ```bash
   python --version
   ```

2. Vérifiez que toutes les dépendances Python sont installées
   ```bash
   npm run check-python-deps
   ```

3. Vérifiez que le service est accessible
   ```bash
   npm run check-chatbot
   ```

4. Assurez-vous que le port 5001 n'est pas déjà utilisé par une autre application
   ```bash
   # Sur Windows
   netstat -ano | findstr :5001

   # Sur Linux/Mac
   lsof -i :5001
   ```

5. Si le problème persiste, essayez de redémarrer le service manuellement
   ```bash
   python scripts/chatbot_service.py --host=0.0.0.0 --port=5001
   ```

   Et vérifiez les messages d'erreur dans la console.

### Problèmes avec les chemins contenant des espaces ou des caractères spéciaux

Si votre projet est situé dans un chemin contenant des espaces, des parenthèses ou d'autres caractères spéciaux (par exemple, `C:\Users\admin\Desktop\pifull - Copie (2)`), vous pourriez rencontrer des problèmes lors du lancement du chatbot.

Dans ce cas, essayez les solutions suivantes :

1. Utilisez le script PowerShell (recommandé pour Windows) :
   ```bash
   npm run start-chatbot-ps
   ```

2. Utilisez le script Node.js :
   ```bash
   npm run start-chatbot-node
   ```

3. Utilisez le script batch avec le chemin complet :
   ```bash
   cd C:\Users\admin\Desktop\pifull - Copie (2)\piBack
   start-chatbot.bat
   ```

4. Lancez Python directement avec le chemin entre guillemets :
   ```bash
   python "C:\Users\admin\Desktop\pifull - Copie (2)\piBack\scripts\chatbot_service.py" --host=0.0.0.0 --port=5001
   ```
