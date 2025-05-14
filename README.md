# BootCamp_CampV

Une plateforme d'apprentissage en ligne complète développée dans le cadre du bootcamp, intégrant des vidéos interactives, des quiz, un chatbot intelligent et un système de reconnaissance faciale pour garantir l'engagement des apprenants.

## Aperçu

Ce projet a été développé dans le cadre du programme de formation BootCamp_CampV. Il s'agit d'une plateforme e-learning complète offrant une expérience d'apprentissage immersive et interactive. Elle intègre des technologies avancées comme la reconnaissance faciale, la transcription audio, et l'intelligence artificielle pour améliorer l'expérience d'apprentissage.

### Objectifs du Projet

- Créer une plateforme d'apprentissage en ligne innovante et accessible
- Intégrer des technologies de pointe pour améliorer l'engagement des apprenants
- Offrir une expérience personnalisée adaptée aux besoins de chaque utilisateur
- Permettre aux formateurs de suivre la progression et l'attention des apprenants
- Faciliter l'accès aux connaissances via des outils d'assistance intelligents

### Public Cible

- Étudiants cherchant à compléter leur formation académique
- Professionnels en reconversion ou en perfectionnement
- Formateurs et institutions éducatives
- Entreprises souhaitant former leurs employés

## Fonctionnalités

### Vidéos Interactives
- **Détection de l'attention** : Surveillance de l'engagement des apprenants via webcam
  - Analyse des expressions faciales pour détecter le niveau de concentration
  - Alertes automatiques en cas de distraction prolongée
  - Pause automatique de la vidéo si l'apprenant n'est pas devant l'écran
- **Quiz intégrés** : Questions apparaissant à des moments clés des vidéos
  - Génération automatique de questions basées sur le contenu récent
  - Adaptation de la difficulté selon les performances de l'utilisateur
- **Transcription en temps réel** : Conversion de l'audio en texte pour améliorer l'accessibilité
  - Utilisation de l'API Google Speech-to-Text pour une transcription précise
  - Possibilité de rechercher dans le contenu audio via les transcriptions
  - Support multilingue pour les apprenants internationaux

### Système de Quiz et Évaluation
- **Vérification par reconnaissance faciale** : Authentification des utilisateurs pendant les examens
  - Prévention de la fraude académique
  - Vérification continue de l'identité pendant toute la durée de l'examen
- **Questions générées dynamiquement** : Basées sur le contenu des vidéos
  - Algorithmes d'extraction de concepts clés
  - Variété de formats de questions (QCM, réponses courtes, associations)
- **Redirection intelligente** : Retour aux sections pertinentes en cas de réponse incorrecte
  - Analyse des erreurs pour identifier les lacunes de compréhension
  - Recommandation personnalisée de ressources supplémentaires
- **Certificats de réussite** : Délivrés automatiquement après validation des compétences
  - Vérifiables via un système de QR code
  - Partageables sur les réseaux professionnels

### Chatbot Intelligent et Assistance
- **Assistant IA** : Aide contextuelle basée sur la page actuelle
  - Compréhension du langage naturel avancée
  - Base de connaissances évolutive sur les contenus du cours
- **Reconnaissance vocale** : Possibilité d'interagir par la voix
  - Support des commandes vocales pour naviguer dans la plateforme
  - Transcription des questions orales en requêtes textuelles
- **Réponses personnalisées** : Adaptées au profil de l'utilisateur
  - Historique des interactions pour un suivi personnalisé
  - Suggestions basées sur les préférences d'apprentissage

### Gestion des Cours et Contenu
- **Catégories et modules** : Organisation hiérarchique du contenu
  - Structure flexible adaptée à différents domaines d'apprentissage
  - Progression séquentielle ou libre selon les préférences
- **Système de paiement** : Intégration avec Stripe pour l'achat de cours
  - Options d'abonnement ou d'achat à l'unité
  - Gestion des promotions et codes de réduction
- **Intégration de contenu externe** : Support pour les vidéos YouTube et autres plateformes
  - Visionnage direct sans redirection vers des sites externes
  - Enrichissement du contenu avec des ressources complémentaires
- **Événements d'apprentissage** : Organisation de sessions live et webinaires
  - Calendrier intégré avec notifications
  - Enregistrement automatique pour visionnage ultérieur

### Tableau de Bord Admin et Analyse
- **Statistiques en temps réel** : Visualisation des données d'utilisation
  - Graphiques interactifs sur l'engagement des utilisateurs
  - Métriques de progression et de réussite
- **Gestion des utilisateurs** : Administration complète des comptes
  - Attribution de rôles et permissions
  - Suivi individuel des parcours d'apprentissage
- **Modération du contenu** : Contrôle des cours et des événements
  - Workflow d'approbation pour les nouveaux contenus
  - Outils de révision et d'amélioration des cours
- **Analyse prédictive** : Identification des tendances et besoins futurs
  - Recommandations pour l'amélioration des contenus
  - Détection précoce des risques d'abandon

## Architecture Technique

### Frontend
- **React.js** : Bibliothèque JavaScript pour construire l'interface utilisateur
  - Hooks et Context API pour la gestion d'état
  - React Router pour la navigation entre les pages
- **Material-UI & Bootstrap** : Frameworks CSS pour un design responsive et moderne
  - Composants personnalisés adaptés à l'expérience d'apprentissage
  - Thème personnalisable selon les préférences de l'utilisateur
- **Chart.js** : Visualisation de données pour les tableaux de bord et analyses
  - Graphiques interactifs pour suivre la progression
  - Représentations visuelles des statistiques d'apprentissage
- **Face-api.js** : Bibliothèque de reconnaissance faciale basée sur TensorFlow.js
  - Détection et analyse des expressions faciales
  - Vérification de l'identité pour les examens sécurisés
- **Socket.IO Client** : Communication en temps réel avec le serveur
  - Notifications instantanées
  - Mise à jour en direct des contenus et interactions

### Backend
- **Node.js & Express** : Environnement d'exécution et framework pour l'API REST
  - Architecture MVC pour une organisation claire du code
  - Middleware personnalisé pour l'authentification et la validation
- **MongoDB** : Base de données NoSQL pour le stockage des données
  - Schémas Mongoose pour la modélisation des données
  - Indexation pour des performances optimales
- **Socket.IO** : Bibliothèque pour les fonctionnalités en temps réel
  - Gestion des connexions WebSocket
  - Diffusion d'événements entre utilisateurs
- **Python** : Service de chatbot et traitement du langage naturel
  - Framework Flask pour l'API du chatbot
  - Bibliothèques NLP pour la compréhension des requêtes
- **PM2** : Gestionnaire de processus pour la production
  - Surveillance et redémarrage automatique des services
  - Gestion des logs et des performances

### Intégrations & Services Externes
- **Google Cloud Speech-to-Text API** : Transcription audio précise
  - Support de multiples langues
  - Adaptation au vocabulaire spécifique des cours
- **Stripe** : Traitement sécurisé des paiements
  - Abonnements récurrents et paiements ponctuels
  - Webhooks pour la gestion des événements de paiement
- **JWT (JSON Web Tokens)** : Authentification sécurisée
  - Gestion des sessions sans état
  - Vérification des permissions basée sur les rôles
- **Cloudinary** : Gestion et optimisation des médias
  - Stockage et diffusion de vidéos et images
  - Transformation à la volée pour différents appareils
- **GitHub** : Gestion de version et collaboration
  - Organisation du code en branches fonctionnelles
  - Intégration continue pour les tests et le déploiement

## Structure du Projet

```
├── pi/                  # Frontend React
│   ├── public/          # Fichiers statiques
│   └── src/             # Code source React
│       ├── components/  # Composants React
│       ├── services/    # Services API
│       └── assets/      # Images et styles
│
├── piBack/              # Backend Node.js
│   ├── config/          # Configuration
│   ├── controllers/     # Contrôleurs
│   ├── middleware/      # Middleware
│   ├── models/          # Modèles MongoDB
│   ├── routes/          # Routes API
│   ├── scripts/         # Scripts Python et utilitaires
│   └── uploads/         # Fichiers téléchargés
│
├── branches/            # Branches de développement
│   ├── main             # Branche principale
│   ├── #1ras            # Fonctionnalités spécifiques
│   ├── #lmraf           # Intégration de la reconnaissance faciale
│   ├── #r7i2            # Améliorations de l'interface utilisateur
│   ├── ahead            # Fonctionnalités avancées
│   └── sha1:1           # Corrections de bugs
```

## Installation

### Prérequis
- Node.js (v14+)
- MongoDB
- Python 3.8+
- npm ou yarn
- Git

### Configuration du Projet

1. Cloner le dépôt
   ```bash
   git clone https://github.com/HACKAHOLICS30/BootCamp_CampV.git
   cd BootCamp_CampV
   ```

2. Installer les dépendances du Backend
   ```bash
   cd piBack
   npm install
   pip install -r requirements.txt
   ```

3. Configurer les variables d'environnement
   ```bash
   cp config/.env.example config/.env
   # Modifier le fichier .env avec vos propres valeurs
   ```

4. Installer les dépendances du Frontend
   ```bash
   cd ../pi
   npm install
   ```

5. Démarrer l'application complète
   ```bash
   cd ../piBack
   npm run dev-with-chatbot
   ```

### Utilisation des Branches

Pour travailler sur une fonctionnalité spécifique:

```bash
# Voir toutes les branches disponibles
git branch -a

# Basculer vers une branche spécifique
git checkout #lmraf  # Pour travailler sur la reconnaissance faciale
git checkout #r7i2   # Pour travailler sur l'interface utilisateur
```

## Configuration de Google Cloud Speech-to-Text

Pour utiliser la fonctionnalité de transcription audio:

1. Créer un projet sur Google Cloud Platform
2. Activer l'API Speech-to-Text
3. Créer un compte de service avec les permissions nécessaires
4. Télécharger le fichier de clé JSON
5. Placer le fichier dans `piBack/config/` sous le nom `google-credentials.json`

## Déploiement et Environnements

Le projet est conçu pour fonctionner dans différents environnements:

### Environnement de Développement
- **Configuration locale**:
  ```bash
  # Démarrer le frontend et le backend
  npm run dev

  # Démarrer avec le service chatbot
  npm run dev-with-chatbot
  ```
- **Hot Reloading**: Rechargement automatique lors des modifications du code
- **Outils de Débogage**: Support pour les extensions de débogage dans VS Code et Chrome

### Environnement de Test
- **Tests Automatisés**:
  ```bash
  # Exécuter les tests unitaires
  npm run test

  # Exécuter les tests d'intégration
  npm run test:integration
  ```
- **Validation de l'Interface**: Tests de compatibilité cross-browser
- **Tests de Performance**: Analyse des temps de réponse et optimisations

### Environnement de Production
- **Configuration avec PM2**:
  ```bash
  # Démarrer tous les services en production
  npm run pm2-start-prod
  ```
- **Surveillance des Performances**:
  - Monitoring en temps réel des services
  - Alertes automatiques en cas de problème
- **Sécurité Renforcée**:
  - Protection contre les attaques CSRF et XSS
  - Rate limiting pour prévenir les abus
  - Validation stricte des entrées utilisateur

### Options d'Hébergement
- **Serveur Dédié**: Configuration optimale pour un contrôle total
- **Services Cloud**: Compatible avec AWS, Google Cloud, Azure
- **Conteneurisation**: Support pour Docker avec configuration multi-conteneurs

## Contribution et Développement Collaboratif

### Guide de Contribution

Pour contribuer au projet:

1. Forker le dépôt sur GitHub
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/amazing-feature`)
3. Développer et tester votre fonctionnalité localement
4. Suivre les standards de code et les conventions du projet
5. Commiter vos changements avec des messages descriptifs (`git commit -m 'Add amazing feature: detailed description'`)
6. Pousser vers votre fork (`git push origin feature/amazing-feature`)
7. Ouvrir une Pull Request détaillée vers la branche principale
8. Participer à la revue de code et apporter les modifications demandées

### Branches Actives

| Branche | Dernière mise à jour | Statut | Commits | Description |
|---------|---------------------|--------|---------|-------------|
| main    | 10 minutes ago      | 3/3    | Default | Branche principale stable |
| firas   | Last week           | 29/1   | Active  | Développement des fonctionnalités de quiz |
| achraf  | 9 hours ago         | 12/4   | Active  | Intégration de la reconnaissance faciale |
| ach2   | 20 hours ago        | 12/1   | Active  | Améliorations de l'interface utilisateur |
| ahmed   | 4 days ago          | 52/1   | Active  | Fonctionnalités avancées pour la prochaine version |
| khalil  | Last week           | 41/34  | Active  | Corrections de bugs et optimisations |

### Standards de Développement

- **Style de Code**: Suivre les conventions ESLint et Prettier configurées
- **Tests**: Chaque nouvelle fonctionnalité doit être accompagnée de tests
- **Documentation**: Mettre à jour la documentation pour refléter les changements
- **Revue de Code**: Toutes les PR nécessitent au moins une revue approuvée
- **CI/CD**: Les tests automatisés doivent passer avant la fusion

## Licence et Droits d'Auteur

Ce projet est sous licence [MIT](LICENSE), ce qui permet une utilisation libre tout en conservant les mentions de droits d'auteur.

### Termes de la Licence MIT
- Liberté d'utilisation, de modification et de distribution
- Inclusion obligatoire de la notice de copyright
- Aucune garantie ou responsabilité des auteurs

## Contact et Support

### Équipe de Développement
Pour toute question technique ou suggestion d'amélioration, veuillez contacter l'équipe de développement via:
- **GitHub**: Ouvrir une issue dans le dépôt
- **Email**: [équipe@bootcampv.com](mailto:équipe@bootcampv.com)

### Support Utilisateur
Pour l'assistance aux utilisateurs de la plateforme:
- **Centre d'aide**: Documentation et tutoriels disponibles dans l'application
- **Chat en direct**: Support en temps réel via le chatbot intégré
- **Forum communautaire**: Échange entre apprenants et formateurs

## Feuille de Route

### Prochaines Fonctionnalités
- Intégration de l'apprentissage par IA pour personnaliser les parcours
- Support pour les cours en réalité virtuelle/augmentée
- Système avancé d'analyse des performances d'apprentissage
- Application mobile native pour iOS et Android

---

Développé avec passion dans le cadre du programme HACKAHOLICS30/BootCamp_CampV.

![Logo BootCamp_CampV](https://github.com/HACKAHOLICS30/BootCamp_CampV/raw/main/logo.png)
