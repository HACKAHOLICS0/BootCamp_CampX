# Transcription Vidéo avec l'API Web Speech

Ce projet utilise l'API Web Speech pour transcrire en temps réel l'audio des vidéos directement dans le navigateur, sans nécessiter de service externe payant.

## Fonctionnement

### 1. API Web Speech

L'API Web Speech est une interface de programmation intégrée aux navigateurs modernes qui permet la reconnaissance vocale directement dans le navigateur. Principales caractéristiques :

- **Gratuite** : Aucun coût d'utilisation
- **Locale** : Fonctionne directement dans le navigateur de l'utilisateur
- **Multi-langues** : Supporte de nombreuses langues, dont le français
- **Temps réel** : Transcription au fur et à mesure que l'audio est joué

### 2. Implémentation

Notre implémentation capture l'audio de la vidéo en cours de lecture et l'envoie à l'API Web Speech pour transcription :

1. Lorsque la vidéo démarre, la reconnaissance vocale est activée
2. L'API Web Speech écoute l'audio de la vidéo
3. Les résultats de transcription sont affichés en temps réel
4. Un mode de secours est disponible en cas d'échec

## Compatibilité

L'API Web Speech est supportée par la plupart des navigateurs modernes :

- **Chrome** : Support complet
- **Edge** : Support complet
- **Safari** : Support partiel (depuis iOS 13)
- **Firefox** : Support limité

Si le navigateur de l'utilisateur ne supporte pas l'API Web Speech, l'application basculera automatiquement en mode de secours.

## Mode de secours

En cas d'échec de l'API Web Speech (navigateur non compatible, problèmes de microphone, etc.), un mode de secours est activé :

1. Un badge "MODE DE SECOURS" s'affiche
2. Une transcription générique basée sur le titre de la vidéo est générée
3. Cette transcription contient des phrases pertinentes au sujet de la vidéo

## Avantages par rapport à Google Speech-to-Text

- **Aucun coût** : Contrairement à Google Speech-to-Text qui est payant
- **Pas de configuration** : Aucune clé API ou compte Google Cloud nécessaire
- **Confidentialité** : Les données audio ne quittent pas le navigateur de l'utilisateur
- **Simplicité** : Aucune dépendance externe requise

## Limitations

- **Précision variable** : La qualité de transcription peut varier selon les navigateurs
- **Dépendance au navigateur** : Ne fonctionne pas sur tous les navigateurs
- **Sensible au bruit** : Les bruits de fond peuvent affecter la qualité
- **Langue** : Actuellement configuré pour le français uniquement

## Personnalisation

Vous pouvez personnaliser la reconnaissance vocale en modifiant les paramètres suivants :

```javascript
// Changer la langue (par exemple pour l'anglais)
recognition.lang = 'en-US';

// Désactiver les résultats intermédiaires
recognition.interimResults = false;

// Augmenter le nombre d'alternatives
recognition.maxAlternatives = 3;
```

## Dépannage

### La transcription n'apparaît pas

- Vérifiez que votre navigateur supporte l'API Web Speech (Chrome recommandé)
- Assurez-vous que la vidéo a bien du son
- Vérifiez que vous avez autorisé l'accès au microphone si demandé

### Transcription de mauvaise qualité

- Essayez d'améliorer la qualité audio de la vidéo
- Réduisez les bruits de fond
- Utilisez un navigateur plus récent (Chrome offre généralement les meilleurs résultats)
