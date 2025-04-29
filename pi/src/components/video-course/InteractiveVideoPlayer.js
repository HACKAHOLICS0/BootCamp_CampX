import React, { useRef, useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import axios from 'axios';
import config from '../../config';
import './TranscriptionStyles.css'; // Importer les styles CSS pour la transcription
import CameraRequiredVideoPlayer from './CameraRequiredVideoPlayer'; // Importer le composant de vérification de caméra

const InteractiveVideoPlayer = ({ videoUrl, videoTitle }) => {
  console.log("InteractiveVideoPlayer - videoUrl:", videoUrl);
  console.log("InteractiveVideoPlayer - videoTitle:", videoTitle);
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const analyserRef = useRef(null);

  // Référence pour stocker l'historique des questions et réponses
  const [questionHistory, setQuestionHistory] = useState([]);
  // Temps de la dernière réponse correcte
  const [lastCorrectAnswerTime, setLastCorrectAnswerTime] = useState(0);
  // État pour afficher un message de redirection
  const [redirectMessage, setRedirectMessage] = useState(null);
  // Référence pour la reconnaissance vocale

  const [error, setError] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const transcriptionRef = useRef(''); // Pour stocker la transcription complète
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [lastQuestionTime, setLastQuestionTime] = useState(0);
  // Initialiser lastCorrectAnswerTime à 0 (début de la vidéo)
  // Ainsi, si l'utilisateur répond incorrectement à la première question, il reviendra au début
  const [audioLevel, setAudioLevel] = useState(0); // Pour visualiser le niveau audio
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isFallbackMode, setIsFallbackMode] = useState(false); // Pour suivre si on utilise le mode de secours
  const transcriptionIntervalRef = useRef(null);
  const recognitionRef = useRef(null); // Pour stocker l'instance de SpeechRecognition

  // Initialiser le contexte audio et les analyseurs
  useEffect(() => {
    // Vérifier si l'API Web Audio est supportée
    if (!window.AudioContext && !window.webkitAudioContext) {
      console.error("L'API Web Audio n'est pas supportée par ce navigateur");
      setError("Votre navigateur ne supporte pas les fonctionnalités audio nécessaires.");
      return;
    }

    // Créer un contexte audio
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContextRef.current = new AudioContext();

    // Créer un analyseur pour visualiser le niveau audio
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;

    return () => {
      // Nettoyer les ressources audio
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }

      // Arrêter la reconnaissance vocale si elle est active
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Erreur lors de l\'arrêt de la reconnaissance vocale:', e);
        }
      }

      if (transcriptionIntervalRef.current) {
        clearInterval(transcriptionIntervalRef.current);
      }
    };
  }, []);

  // Fonction pour connecter la vidéo au contexte audio
  const connectAudioNodes = () => {
    if (!videoRef.current || !audioContextRef.current) {
      console.error('Vidéo ou contexte audio non disponible');
      return;
    }

    try {
      // Déconnecter les anciens nœuds si nécessaire
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }

      // Vérifier si la vidéo est chargée
      if (videoRef.current.readyState === 0) {
        console.log('La vidéo n\'est pas encore chargée, attente...');
        // On attendra l'événement loadedmetadata
        return;
      }

      // Créer un MediaElementSourceNode à partir de la vidéo
      sourceNodeRef.current = audioContextRef.current.createMediaElementSource(videoRef.current);

      // Connecter la source à l'analyseur puis à la destination
      sourceNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);

      console.log('Nœuds audio connectés avec succès');
    } catch (error) {
      console.error('Erreur lors de la connexion des nœuds audio:', error);
      setError('Erreur lors de l\'initialisation de l\'audio. Veuillez recharger la page.');
    }
  };

  // Fonction pour démarrer la reconnaissance vocale avec l'API Web Speech
  const startSpeechRecognition = () => {
    // Vérifier si l'API est supportée
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error("La reconnaissance vocale n'est pas supportée par ce navigateur");
      setIsFallbackMode(true);
      setTranscription("[Mode de secours activé] Votre navigateur ne supporte pas la reconnaissance vocale.");
      return;
    }

    try {
      // Si l'instance existe déjà, l'arrêter et la réutiliser
      if (recognitionRef.current) {
        try {
          // Arrêter l'instance si elle est en cours d'exécution
          recognitionRef.current.stop();
        } catch (e) {
          // Ignorer l'erreur si elle n'est pas en cours d'exécution
          console.log('Reconnaissance déjà arrêtée ou pas encore démarrée');
        }
      } else {
        // Créer une nouvelle instance si elle n'existe pas encore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
      }

      // Configurer pour une réponse plus rapide et une meilleure tolérance
      recognitionRef.current.lang = 'fr-FR'; // Langue française
      recognitionRef.current.continuous = true; // Reconnaissance continue
      recognitionRef.current.interimResults = true; // Résultats intermédiaires
      recognitionRef.current.maxAlternatives = 3; // Augmenter les alternatives pour améliorer les chances de reconnaissance

      // Initialiser le compteur d'erreurs no-speech
      recognitionRef.current.noSpeechErrorCount = 0;

      // Ajouter un message d'attente immédiat avec animation
      setTranscription('<span class="waiting-text" style="color: #888;">Initialisation de la transcription <span class="dot-animation">...</span></span>');

      // Mettre à jour le message après un court délai pour montrer que ça progresse
      setTimeout(() => {
        if (transcriptionRef.current === '') {
          setTranscription('<span class="waiting-text" style="color: #888;">Analyse audio en cours <span class="dot-animation">...</span></span>');

          // Ajouter un autre message après un délai plus long
          setTimeout(() => {
            if (transcriptionRef.current === '') {
              setTranscription('<span class="waiting-text" style="color: #888;">Détection des paroles <span class="dot-animation">...</span></span>');
            }
          }, 3000);
        }
      }, 1000);

      // Gérer les résultats
      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        // Réinitialiser le compteur d'erreurs no-speech lorsqu'on reçoit des résultats
        if (recognitionRef.current.noSpeechErrorCount) {
          recognitionRef.current.noSpeechErrorCount = 0;
          console.log("Compteur d'erreurs no-speech réinitialisé");
        }

        // Traiter tous les résultats
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Mettre à jour la transcription avec les résultats intermédiaires et finaux
        let updatedTranscription = transcriptionRef.current;

        if (finalTranscript) {
          transcriptionRef.current += finalTranscript;
          updatedTranscription = transcriptionRef.current;
          setIsFallbackMode(false);
        }

        // Afficher aussi les résultats intermédiaires pour un retour plus rapide
        if (interimTranscript) {
          updatedTranscription = transcriptionRef.current +
            `<span class="interim-text" style="color: #888;">${interimTranscript}</span>`;
        }

        setTranscription(updatedTranscription);
      };

      // Gérer les erreurs
      recognitionRef.current.onerror = (event) => {
        console.error('Erreur de reconnaissance vocale:', event.error);

        // Compteur d'erreurs no-speech
        if (!recognitionRef.current.noSpeechErrorCount) {
          recognitionRef.current.noSpeechErrorCount = 0;
        }

        // Traiter différemment selon le type d'erreur
        if (event.error === 'no-speech') {
          // Incrémenter le compteur d'erreurs no-speech
          recognitionRef.current.noSpeechErrorCount++;
          console.log(`Erreur no-speech (${recognitionRef.current.noSpeechErrorCount}/3)`);

          // Ne passer en mode de secours qu'après plusieurs erreurs consécutives
          if (recognitionRef.current.noSpeechErrorCount >= 3) {
            console.log("Trop d'erreurs no-speech consécutives, passage en mode de secours");
            setIsFallbackMode(true);
            useFallbackTranscription();
          }
        }
        // Pour les autres types d'erreurs critiques, passer immédiatement en mode de secours
        else if (event.error === 'audio-capture' || event.error === 'not-allowed') {
          console.log("Erreur critique de reconnaissance vocale, passage en mode de secours");
          setIsFallbackMode(true);
          useFallbackTranscription();
        }
      };

      // Gérer la fin de la reconnaissance
      recognitionRef.current.onend = () => {
        // Redémarrer la reconnaissance si la vidéo est toujours en lecture
        if (isVideoPlaying && videoRef.current && !videoRef.current.paused) {
          console.log('Reconnaissance terminée, redémarrage...');

          // Vérifier si nous sommes en mode de secours
          if (isFallbackMode) {
            console.log('Mode de secours actif, pas de redémarrage de la reconnaissance vocale');
            return;
          }

          // Ajouter un délai progressif pour éviter de surcharger le navigateur
          // en cas d'erreurs répétées
          const delayBeforeRestart = recognitionRef.current.noSpeechErrorCount > 0
            ? Math.min(recognitionRef.current.noSpeechErrorCount * 500, 2000) // Délai progressif jusqu'à 2 secondes max
            : 100; // Délai minimal

          setTimeout(() => {
            try {
              // Vérifier à nouveau si la vidéo est toujours en lecture
              if (videoRef.current && !videoRef.current.paused) {
                console.log(`Redémarrage de la reconnaissance après ${delayBeforeRestart}ms`);
                recognitionRef.current.start();
              } else {
                console.log('La vidéo a été mise en pause pendant le délai, annulation du redémarrage');
                setIsTranscribing(false);
              }
            } catch (error) {
              console.error('Erreur lors du redémarrage de la reconnaissance:', error);

              // En cas d'erreur répétée, passer en mode de secours
              if (error.message && error.message.includes('already started')) {
                console.log('La reconnaissance est déjà en cours, pas besoin de redémarrer');
              } else {
                console.error('Erreur inattendue, passage en mode de secours');
                setIsFallbackMode(true);
                useFallbackTranscription();
              }
            }
          }, delayBeforeRestart);
        } else {
          console.log('Vidéo en pause, arrêt de la transcription');
          setIsTranscribing(false);
        }
      };

      // Démarrer la reconnaissance
      recognitionRef.current.start();
      setIsTranscribing(true);

    } catch (error) {
      console.error('Erreur lors du démarrage de la reconnaissance vocale:', error);
      setIsFallbackMode(true);
      useFallbackTranscription();
    }
  };

  // Fonction pour utiliser la transcription de secours
  const useFallbackTranscription = () => {
    // Conserver la transcription existante si elle existe
    const existingTranscription = transcriptionRef.current;

    // Afficher un message d'information sur le mode de secours
    const fallbackNotice = existingTranscription ?
      `<div style="margin: 10px 0; padding: 8px; background-color: rgba(255, 152, 0, 0.1); border-left: 3px solid #ff9800; font-size: 0.9em;">
        <span style="color: #ff9800; font-weight: bold;">⚠️ Mode de secours activé</span><br/>
        <span style="font-size: 0.85em; color: #666;">La reconnaissance vocale automatique n'a pas pu détecter l'audio de la vidéo.
        Une transcription approximative basée sur le titre sera générée.</span>
      </div>` :
      '<span style="color: #ff9800; font-weight: bold;">⚠️ Mode de secours activé</span><br/>Génération de la transcription basée sur le contenu...';

    // Mettre à jour la transcription avec le message de mode de secours
    if (existingTranscription) {
      setTranscription(existingTranscription + fallbackNotice);
    } else {
      setTranscription(fallbackNotice);
    }

    // Générer une transcription basée sur le titre de la vidéo
    const generateFallbackText = () => {
      // Base de données de phrases par sujet étendue
      const phrasesDatabase = {
        'html': [
          "Dans cette partie, nous allons explorer les balises HTML fondamentales.",
          "Le HTML est la structure de base de toute page web.",
          "Les balises div et span sont essentielles pour organiser le contenu.",
          "N'oubliez pas de toujours fermer vos balises correctement.",
          "Les attributs permettent de configurer le comportement des éléments HTML.",
          "La sémantique HTML5 améliore l'accessibilité et le référencement."
        ],
        'css': [
          "Le CSS permet de styliser vos pages web.",
          "Les sélecteurs CSS ciblent des éléments spécifiques de votre page.",
          "Avec les media queries, vous pouvez créer des designs responsives.",
          "Les propriétés flex et grid simplifient la mise en page.",
          "Les animations CSS permettent d'ajouter du dynamisme à vos interfaces.",
          "Les variables CSS facilitent la maintenance de vos styles."
        ],
        'javascript': [
          "JavaScript permet d'ajouter de l'interactivité à vos sites.",
          "Les fonctions sont des blocs de code réutilisables.",
          "Les événements permettent de réagir aux actions des utilisateurs.",
          "Les variables let et const ont remplacé var dans le JavaScript moderne.",
          "Les promesses et async/await simplifient la gestion des opérations asynchrones.",
          "Les modules ES6 permettent de mieux organiser votre code."
        ],
        'sql': [
          "SQL est un langage de requête pour les bases de données relationnelles.",
          "Les requêtes SELECT permettent d'extraire des données des tables.",
          "Les jointures combinent les données de plusieurs tables.",
          "Les index améliorent les performances des requêtes.",
          "Les transactions garantissent l'intégrité des données.",
          "Les procédures stockées encapsulent la logique métier dans la base de données."
        ],
        'mongodb': [
          "MongoDB est une base de données NoSQL orientée documents.",
          "Les documents sont stockés au format BSON, similaire au JSON.",
          "Les collections regroupent des documents de même nature.",
          "Les requêtes d'agrégation permettent de transformer et d'analyser les données.",
          "Les index améliorent les performances des opérations de lecture.",
          "Le schéma flexible permet d'adapter facilement la structure des données."
        ],
        'default': [
          "Cette vidéo présente les concepts fondamentaux du sujet.",
          "L'instructeur explique étape par étape comment procéder.",
          "Ces techniques peuvent être appliquées dans différents contextes.",
          "N'hésitez pas à pratiquer pour maîtriser ces concepts.",
          "Les exemples concrets illustrent l'application pratique de la théorie.",
          "La compréhension de ces principes est essentielle pour progresser."
        ]
      };

      // Déterminer les catégories pertinentes
      const keywords = videoTitle ? videoTitle.toLowerCase().split(/\s+/) : [];
      const relevantCategories = Object.keys(phrasesDatabase).filter(
        category => keywords.some(word => word.includes(category))
      );

      // Si aucune catégorie pertinente, utiliser default
      const categoriesToUse = relevantCategories.length > 0 ?
        relevantCategories : ['default'];

      // Construire une transcription à partir des phrases pertinentes
      let fallbackText = "";

      // Ajouter 3-4 phrases de chaque catégorie pertinente
      categoriesToUse.forEach(category => {
        const phrases = phrasesDatabase[category];
        const selectedPhrases = phrases
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(4, phrases.length));

        fallbackText += selectedPhrases.join(' ') + '\n\n';
      });

      return fallbackText;
    };

    // Ajouter la transcription de secours après un court délai pour simuler le traitement
    setTimeout(() => {
      const fallbackText = generateFallbackText();

      // Si une transcription existait déjà, la conserver et ajouter le texte de secours
      if (existingTranscription) {
        transcriptionRef.current = existingTranscription +
          `<div style="margin: 10px 0; padding: 8px; background-color: rgba(255, 152, 0, 0.1); border-left: 3px solid #ff9800; font-size: 0.9em;">
            <span style="color: #ff9800; font-weight: bold;">⚠️ Mode de secours activé</span>
          </div>` +
          fallbackText;
      } else {
        transcriptionRef.current = fallbackText;
      }

      setTranscription(transcriptionRef.current);
    }, 1000);
  };

  // Fonction pour visualiser le niveau audio
  const visualizeAudio = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculer le niveau audio moyen
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    setAudioLevel(average);

    // Continuer la visualisation si la vidéo est en lecture
    if (isVideoPlaying) {
      requestAnimationFrame(visualizeAudio);
    }
  };

  const handleError = (e) => {
    console.error("Erreur de chargement de la vidéo:", e);
    console.log("URL de la vidéo:", videoUrl);
    setError("La vidéo n'a pas pu être chargée. Veuillez réessayer ou contacter l'administrateur si le problème persiste.");
  };

  const handleRetry = () => {
    if (videoRef.current) {
      videoRef.current.load();
      setError(null);
      // Réinitialiser la transcription
      transcriptionRef.current = '';
      setTranscription('');
    }
  };

  // Initialiser l'audio lors du chargement de la vidéo
  const handleLoadedMetadata = () => {
    // Activer le contexte audio si nécessaire
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    // Connecter les nœuds audio
    if (!sourceNodeRef.current) {
      connectAudioNodes();
    }

    // Pré-initialiser la reconnaissance vocale pour réduire le délai au démarrage
    if (!recognitionRef.current && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'fr-FR';
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      // Configurer les événements mais ne pas démarrer la reconnaissance
      recognitionRef.current.onend = () => {
        console.log('Reconnaissance pré-initialisée terminée');
      };
    }
  };

  const handlePlay = () => {
    setIsVideoPlaying(true);

    // Activer le contexte audio si nécessaire
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    // Démarrer la reconnaissance vocale
    startSpeechRecognition();

    // Démarrer la visualisation audio
    visualizeAudio();
  };

  const handlePause = () => {
    setIsVideoPlaying(false);

    // Arrêter la reconnaissance vocale
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setIsTranscribing(false);
  };

  // Gérer la fin de la vidéo
  const handleEnded = () => {
    setIsVideoPlaying(false);

    // Arrêter la reconnaissance vocale
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setIsTranscribing(false);
  };

  const transcriptionBoxRef = useRef(null);

  // Effet pour faire défiler automatiquement vers le bas
  useEffect(() => {
    if (transcriptionBoxRef.current) {
      transcriptionBoxRef.current.scrollTop = transcriptionBoxRef.current.scrollHeight;
    }
  }, [transcription]);

  // Fonction pour extraire la transcription des 5 dernières minutes
  const getRecentTranscription = () => {
    const fullTranscription = transcriptionRef.current.replace(/<[^>]*>/g, '').trim();
    if (!fullTranscription) return "";

    // Si la vidéo est en cours de lecture depuis moins de 5 minutes, utiliser toute la transcription
    if (videoRef.current && videoRef.current.currentTime < 300) {
      return fullTranscription;
    }

    // Diviser la transcription en phrases
    const sentences = fullTranscription.split(/(?<=\.|\?|\!)\s+/);

    // Estimer le nombre de mots par minute (en moyenne 150 mots par minute)
    const wordsPerMinute = 150;
    const wordsForFiveMinutes = wordsPerMinute * 5;

    // Compter à rebours depuis la fin pour obtenir environ 5 minutes de contenu
    let wordCount = 0;
    let recentSentences = [];

    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentenceWords = sentences[i].split(/\s+/).length;
      wordCount += sentenceWords;
      recentSentences.unshift(sentences[i]);

      if (wordCount >= wordsForFiveMinutes) {
        break;
      }
    }

    return recentSentences.join(" ");
  };

  // Fonction pour générer une question
  const generateQuestion = async () => {
    // Extraire la transcription des 5 dernières minutes
    const recentTranscription = getRecentTranscription();
    if (!recentTranscription) {
      console.log("Pas de transcription récente disponible pour générer une question");
      return;
    }

    // Afficher un message de chargement
    setCurrentQuestion({
      question: "Génération d'une question en cours...",
      options: ["Veuillez patienter"],
      isLoading: true
    });

    try {
      // Mettre la vidéo en pause avant de faire la requête
      if (videoRef.current) {
        videoRef.current.pause();
      }

      console.log("Envoi de la transcription récente pour générer une question:", recentTranscription.substring(0, 100) + "...");

      const response = await fetch('http://localhost:5000/api/questions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: recentTranscription,
          videoTitle: videoTitle || '',
          currentTime: videoRef.current ? videoRef.current.currentTime : 0
        })
      });

      console.log("Temps actuel de la vidéo envoyé:", videoRef.current ? videoRef.current.currentTime : 0);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération de la question');
      }

      if (Array.isArray(data) && data.length > 0) {
        console.log("Question générée:", data[0]);
        // Ajouter des informations supplémentaires à la question
        const currentVideoTime = videoRef.current ? videoRef.current.currentTime : 0;
        const questionWithMetadata = {
          ...data[0],
          generatedAt: new Date().toISOString(),
          transcriptionLength: recentTranscription.length,
          videoPosition: currentVideoTime
        };

        // Ajouter la question à l'historique
        setQuestionHistory(prevHistory => [
          ...prevHistory,
          {
            question: questionWithMetadata,
            videoTime: currentVideoTime,
            answered: false,
            isCorrect: null
          }
        ]);

        setCurrentQuestion(questionWithMetadata);
      } else {
        console.error('Aucune question générée');
        setCurrentQuestion(null);
        if (videoRef.current) {
          videoRef.current.play();
        }
      }
    } catch (error) {
      console.error('Erreur lors de la génération de question:', error);
      // En cas d'erreur, reprendre la lecture
      setCurrentQuestion(null);
      if (videoRef.current) {
        videoRef.current.play();
      }
    }
  };

  // Vérifier périodiquement s'il faut générer une question
  useEffect(() => {
    const checkForQuestion = () => {
      if (videoRef.current && !videoRef.current.paused && !currentQuestion) {
        const currentTime = videoRef.current.currentTime;
        if (currentTime - lastQuestionTime >= 300) { // 300 secondes = 5 minutes
          console.log("Génération d'une question à", currentTime);
          generateQuestion();
          setLastQuestionTime(currentTime);
        }
      }
    };

    const intervalId = setInterval(checkForQuestion, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [lastQuestionTime, currentQuestion]);

  // Gérer la réponse à la question
  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowExplanation(true);

    // Vérifier si la réponse est correcte
    const isCorrect = currentQuestion && answer === currentQuestion.correct_answer;

    // Mettre à jour l'historique des questions
    if (currentQuestion) {
      setQuestionHistory(prevHistory => {
        // Trouver la dernière question dans l'historique
        const updatedHistory = [...prevHistory];
        const lastQuestionIndex = updatedHistory.length - 1;

        if (lastQuestionIndex >= 0) {
          updatedHistory[lastQuestionIndex] = {
            ...updatedHistory[lastQuestionIndex],
            answered: true,
            isCorrect: isCorrect,
            userAnswer: answer
          };
        }

        return updatedHistory;
      });

      // Si la réponse est correcte, mettre à jour le temps de la dernière réponse correcte
      if (isCorrect) {
        setLastCorrectAnswerTime(currentQuestion.videoPosition);
      }
    }
  };

  // Continuer la vidéo après la question
  const handleContinue = () => {
    // Vérifier si la réponse était correcte
    const lastQuestion = questionHistory.length > 0 ? questionHistory[questionHistory.length - 1] : null;
    const wasCorrect = lastQuestion && lastQuestion.isCorrect;

    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setShowExplanation(false);

    if (videoRef.current) {
      // Si la réponse était incorrecte, revenir au temps de la dernière réponse correcte
      if (!wasCorrect && lastCorrectAnswerTime >= 0) {
        // Calculer le temps de retour en minutes et secondes pour l'affichage
        const minutes = Math.floor(lastCorrectAnswerTime / 60);
        const seconds = Math.floor(lastCorrectAnswerTime % 60);
        const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        // Afficher un message de redirection
        setRedirectMessage(`Réponse incorrecte. Retour à ${formattedTime} pour revoir le contenu.`);

        // Revenir au temps de la dernière réponse correcte
        videoRef.current.currentTime = lastCorrectAnswerTime;
        videoRef.current.play();

        // Masquer le message après 5 secondes
        setTimeout(() => {
          setRedirectMessage(null);
        }, 5000);
      } else {
        // Si la réponse était correcte, continuer la vidéo normalement
        videoRef.current.play();
      }
    }
  };

  if (!videoUrl) {
    return (
      <Box sx={{
        width: '100%',
        textAlign: 'center',
        p: 2
      }}>
        <Typography>Vidéo non disponible</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <CameraRequiredVideoPlayer
        videoUrl={videoUrl}
        videoTitle={videoTitle}
        onVideoReady={(element) => {
          videoRef.current = element;
        }}
      >
        <video
          style={{
            width: '100%',
            display: 'block'
          }}
          controls
          onError={handleError}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onLoadedMetadata={handleLoadedMetadata}
          crossOrigin="anonymous" // Nécessaire pour capturer l'audio
        >
          <source src={videoUrl} type="video/mp4" />
          Votre navigateur ne supporte pas la lecture des vidéos.
        </video>
      </CameraRequiredVideoPlayer>

      {/* Message de redirection */}
      {redirectMessage && (
        <Box sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          p: 3,
          borderRadius: 2,
          textAlign: 'center',
          animation: 'fadeIn 0.5s',
          zIndex: 1000,
          maxWidth: '80%'
        }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {redirectMessage}
          </Typography>
          <Typography variant="body2">
            Vous devez revoir cette partie pour mieux comprendre le contenu.
          </Typography>
        </Box>
      )}

      {error && (
        <Box sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          p: 2,
          borderRadius: 1,
          textAlign: 'center',
          zIndex: 1000
        }}>
          <Typography>{error}</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleRetry}
              sx={{ mt: 2 }}
            >
              Réessayer
            </Button>
            <Button
              variant="outlined"
              color="info"
              onClick={() => window.open(videoUrl, '_blank')}
              sx={{ mt: 1 }}
            >
              Ouvrir la vidéo dans un nouvel onglet
            </Button>
          </Box>
        </Box>
      )}

      {/* Zone de transcription */}
      <Paper
        ref={transcriptionBoxRef}
        elevation={3}
        sx={{
          mt: 2,
          p: 2,
          minHeight: '150px',
          maxHeight: '300px',
          overflowY: 'auto',
          bgcolor: 'background.paper',
          borderRadius: 1,
          position: 'relative'
        }}
      >
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6">
              Transcription complète
            </Typography>
            <Box
              sx={{
                ml: 1,
                px: 1,
                py: 0.5,
                bgcolor: isFallbackMode ? 'warning.main' : 'success.main',
                color: 'white',
                borderRadius: 1,
                fontSize: '0.7rem',
                fontWeight: 'bold'
              }}
            >
              {isFallbackMode ? 'MODE DE SECOURS' : 'WEB SPEECH API'}
            </Box>
          </Box>
          {isTranscribing && (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              color: 'success.main',
              fontSize: '0.875rem'
            }}>
              <span className="pulse-dot"></span>
              Transcription en cours<span className="dot-animation"></span>
            </Box>
          )}
        </Box>

        {/* Visualisation du niveau audio */}
        {isVideoPlaying && (
          <Box sx={{
            width: '100%',
            height: 4,
            bgcolor: 'grey.200',
            mb: 2,
            borderRadius: 2,
            overflow: 'hidden'
          }}>
            <Box
              sx={{
                height: '100%',
                width: `${Math.min(audioLevel / 2, 100)}%`,
                bgcolor: 'primary.main',
                transition: 'width 0.1s ease-in-out'
              }}
            />
          </Box>
        )}

        <Box
          sx={{
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '1.1rem',
            lineHeight: 1.5
          }}
          dangerouslySetInnerHTML={{
            __html: transcription || 'La transcription apparaîtra pendant la lecture...'
          }}
        />
      </Paper>

      {/* Dialog pour afficher la question */}
      <Dialog
        open={!!currentQuestion}
        onClose={() => {}}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Question sur le contenu</DialogTitle>
        <DialogContent>
          {currentQuestion && (
            <>
              {currentQuestion.isLoading ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Génération d'une question basée sur la transcription...
                  </Typography>
                  <Box sx={{ display: 'inline-block', position: 'relative', width: '80px', height: '10px' }}>
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        animation: 'dot-flashing 1s infinite linear alternate',
                        animationDelay: '0s'
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: '20px',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        animation: 'dot-flashing 1s infinite linear alternate',
                        animationDelay: '0.2s'
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: '40px',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        animation: 'dot-flashing 1s infinite linear alternate',
                        animationDelay: '0.4s'
                      }}
                    />
                  </Box>
                </Box>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                    {currentQuestion.question}
                  </Typography>
                  {currentQuestion.domain && (
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'none' }}>
                      Domaine: {currentQuestion.domain} | Mots-clés: {currentQuestion.keywords?.join(', ')}
                    </Typography>
                  )}
                  <Box sx={{ mt: 2 }}>
                    {currentQuestion.options.map((option, index) => (
                      <Button
                        key={index}
                        variant={selectedAnswer === option ? "contained" : "outlined"}
                        onClick={() => handleAnswer(option)}
                        disabled={!!selectedAnswer}
                        sx={{
                          mb: 1,
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 12px',
                          justifyContent: 'flex-start',
                          fontSize: '0.9rem',
                          lineHeight: 1.3,
                          backgroundColor: selectedAnswer === option &&
                                        option === currentQuestion.correct_answer ?
                                        'success.light' : undefined
                        }}
                      >
                        {option}
                      </Button>
                    ))}
                  </Box>
                </>
              )}
              {showExplanation && (
                <Box sx={{ mt: 2, p: 2, bgcolor: selectedAnswer === currentQuestion.correct_answer ? 'success.light' : 'error.light', borderRadius: 1 }}>
                  <Typography variant="body1" color={
                    selectedAnswer === currentQuestion.correct_answer ?
                    "success.dark" : "error.dark"
                  } sx={{ fontWeight: 'bold' }}>
                    {selectedAnswer === currentQuestion.correct_answer ?
                      "Correct !" :
                      "Incorrect."
                    }
                  </Typography>
                  {selectedAnswer !== currentQuestion.correct_answer && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Bonne réponse : {currentQuestion.correct_answer}
                    </Typography>
                  )}
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          {showExplanation && (
            <Button
              onClick={handleContinue}
              variant="contained"
              color="primary"
            >
              Continuer la vidéo
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InteractiveVideoPlayer;