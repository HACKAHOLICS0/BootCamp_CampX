/**
 * GrimaceDetector - Détecteur de grimaces basé sur les points de repère faciaux
 *
 * Ce module utilise les points de repère faciaux (landmarks) détectés par face-api.js
 * pour analyser les expressions faciales et détecter les grimaces.
 */

class GrimaceDetector {
  constructor(options = {}) {
    // Configuration par défaut
    this.config = {
      // Seuil pour considérer les yeux comme fermés (ratio hauteur/largeur)
      // Valeur plus basse pour tolérer les clignements naturels
      eyeClosedThreshold: 0.2,

      // Seuil pour considérer la bouche comme trop ouverte (ratio hauteur/largeur)
      mouthOpenThreshold: 0.6,

      // Seuil pour l'asymétrie de la bouche
      mouthAsymmetryThreshold: 0.3,

      // Seuil pour l'attention globale (0-100)
      attentionThreshold: 70,

      // Poids des différentes composantes dans le calcul de l'attention
      weights: {
        eyeOpenness: 0.4,    // Importance réduite de l'ouverture des yeux
        mouthNormal: 0.2,    // Importance de la position normale de la bouche
        faceSymmetry: 0.4    // Importance augmentée de la symétrie du visage (pour détecter si l'étudiant regarde ailleurs)
      },

      // Nombre de détections consécutives nécessaires pour confirmer une inattention
      // Cela évite les faux positifs dus aux clignements naturels
      consecutiveDetectionsRequired: 3,

      // Activer les logs de débogage
      debug: true
    };

    // Compteur pour les détections consécutives
    this.consecutiveEyesClosedCount = 0;
    this.consecutiveMouthOpenCount = 0;
    this.consecutiveAsymmetryCount = 0;

    // Fusionner avec les options fournies
    this.config = { ...this.config, ...options };

    // État interne
    this.lastResults = null;
    this.isInitialized = true;

    if (this.config.debug) {
      console.log("✅ GrimaceDetector initialisé avec la configuration:", this.config);
    }
  }

  /**
   * Calcule la distance euclidienne entre deux points
   */
  distance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  /**
   * Calcule le point moyen d'un ensemble de points
   */
  meanPoint(points) {
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / points.length, y: sum.y / points.length };
  }

  /**
   * Analyse les points de repère faciaux pour détecter les grimaces
   *
   * @param {Object} landmarks - Objet FaceLandmarks68 de face-api.js
   * @returns {Object} Résultats de l'analyse
   */
  analyze(landmarks) {
    console.log("🔍 GrimaceDetector.analyze - Début de l'analyse");

    // Vérification approfondie des landmarks
    if (!landmarks) {
      console.error("❌ Points de repère faciaux manquants (null ou undefined)");
      return {
        isGrimacing: false,
        attentionScore: 100,
        eyesClosed: false,
        mouthOpen: false,
        details: { error: "landmarks_missing" }
      };
    }

    if (!landmarks.positions) {
      console.error("❌ Propriété 'positions' manquante dans les landmarks:", landmarks);
      return {
        isGrimacing: false,
        attentionScore: 100,
        eyesClosed: false,
        mouthOpen: false,
        details: { error: "positions_missing" }
      };
    }

    if (landmarks.positions.length !== 68) {
      console.error(`❌ Nombre incorrect de points de repère: ${landmarks.positions.length} (attendu: 68)`);
      return {
        isGrimacing: false,
        attentionScore: 100,
        eyesClosed: false,
        mouthOpen: false,
        details: { error: "invalid_landmark_count", count: landmarks.positions.length }
      };
    }

    // Vérifier que les méthodes d'extraction sont disponibles
    if (typeof landmarks.getLeftEye !== 'function' ||
        typeof landmarks.getRightEye !== 'function' ||
        typeof landmarks.getMouth !== 'function') {
      console.error("❌ Méthodes d'extraction des points de repère manquantes");
      return {
        isGrimacing: false,
        attentionScore: 100,
        eyesClosed: false,
        mouthOpen: false,
        details: { error: "missing_extraction_methods" }
      };
    }

    try {
      console.log("✅ Points de repère valides, extraction des parties du visage");

      // Extraire les points des différentes parties du visage
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const mouth = landmarks.getMouth();
      const nose = landmarks.getNose();
      const jawOutline = landmarks.getJawOutline();

      console.log(`✅ Parties extraites: yeux (${leftEye.length}, ${rightEye.length}), bouche (${mouth.length}), nez (${nose.length}), mâchoire (${jawOutline.length})`);

      // Vérifier que toutes les parties ont été extraites correctement
      if (!leftEye.length || !rightEye.length || !mouth.length || !nose.length || !jawOutline.length) {
        console.error("❌ Une ou plusieurs parties du visage n'ont pas pu être extraites");
        return {
          isGrimacing: false,
          attentionScore: 100,
          eyesClosed: false,
          mouthOpen: false,
          details: { error: "extraction_failed" }
        };
      }

      // 1. Analyser l'ouverture des yeux
      const leftEyeTop = Math.min(...leftEye.map(p => p.y));
      const leftEyeBottom = Math.max(...leftEye.map(p => p.y));
      const leftEyeHeight = leftEyeBottom - leftEyeTop;
      const leftEyeWidth = Math.max(...leftEye.map(p => p.x)) - Math.min(...leftEye.map(p => p.x));
      const leftEyeRatio = leftEyeHeight / leftEyeWidth;

      const rightEyeTop = Math.min(...rightEye.map(p => p.y));
      const rightEyeBottom = Math.max(...rightEye.map(p => p.y));
      const rightEyeHeight = rightEyeBottom - rightEyeTop;
      const rightEyeWidth = Math.max(...rightEye.map(p => p.x)) - Math.min(...rightEye.map(p => p.x));
      const rightEyeRatio = rightEyeHeight / rightEyeWidth;

      // Moyenne des deux yeux
      const eyeRatio = (leftEyeRatio + rightEyeRatio) / 2;

      // Normaliser en pourcentage (valeurs typiques entre 0.2 et 0.5 pour des yeux ouverts)
      const maxRatio = 0.5; // Ratio maximum pour des yeux grands ouverts
      const minRatio = 0.1; // Ratio minimum pour des yeux fermés
      const eyeOpenPercentage = Math.min(100, Math.max(0, ((eyeRatio - minRatio) / (maxRatio - minRatio)) * 100));

      // Déterminer si les yeux sont fermés
      const eyesClosed = eyeRatio < this.config.eyeClosedThreshold;

      // 2. Analyser la bouche
      const mouthTop = Math.min(...mouth.slice(3, 9).map(p => p.y));
      const mouthBottom = Math.max(...mouth.slice(3, 9).map(p => p.y));
      const mouthHeight = mouthBottom - mouthTop;
      const mouthWidth = Math.max(...mouth.map(p => p.x)) - Math.min(...mouth.map(p => p.x));
      const mouthRatio = mouthHeight / mouthWidth;

      // Calculer l'asymétrie de la bouche
      const leftMouthCorner = mouth[0];
      const rightMouthCorner = mouth[6];
      const mouthCenter = mouth[3];
      const leftDistance = this.distance(leftMouthCorner, mouthCenter);
      const rightDistance = this.distance(rightMouthCorner, mouthCenter);
      const mouthAsymmetry = Math.abs(leftDistance - rightDistance) / ((leftDistance + rightDistance) / 2);

      // Déterminer si la bouche est trop ouverte
      const mouthOpen = mouthRatio > this.config.mouthOpenThreshold;

      // 3. Calculer la symétrie globale du visage
      const faceCenter = nose[0]; // Point central du nez
      const leftJaw = jawOutline.slice(0, 9); // Partie gauche de la mâchoire
      const rightJaw = jawOutline.slice(9); // Partie droite de la mâchoire

      const leftJawCenter = this.meanPoint(leftJaw);
      const rightJawCenter = this.meanPoint(rightJaw);

      const leftFaceDistance = this.distance(faceCenter, leftJawCenter);
      const rightFaceDistance = this.distance(faceCenter, rightJawCenter);

      const faceAsymmetry = Math.abs(leftFaceDistance - rightFaceDistance) / ((leftFaceDistance + rightFaceDistance) / 2);
      const faceSymmetryScore = Math.max(0, 100 - (faceAsymmetry * 200));

      // 4. Calculer le score d'attention global
      const eyeOpennessScore = eyeOpenPercentage;
      const mouthNormalScore = mouthOpen ? 0 : 100;

      const attentionScore = Math.round(
        (eyeOpennessScore * this.config.weights.eyeOpenness) +
        (mouthNormalScore * this.config.weights.mouthNormal) +
        (faceSymmetryScore * this.config.weights.faceSymmetry)
      );

      // Mettre à jour les compteurs de détections consécutives
      if (eyesClosed) {
        this.consecutiveEyesClosedCount++;
      } else {
        this.consecutiveEyesClosedCount = 0;
      }

      if (mouthOpen) {
        this.consecutiveMouthOpenCount++;
      } else {
        this.consecutiveMouthOpenCount = 0;
      }

      if (faceAsymmetry > this.config.mouthAsymmetryThreshold) {
        this.consecutiveAsymmetryCount++;
      } else {
        this.consecutiveAsymmetryCount = 0;
      }

      // 5. Déterminer si l'utilisateur fait une grimace en tenant compte des détections consécutives
      const persistentEyesClosed = this.consecutiveEyesClosedCount >= this.config.consecutiveDetectionsRequired;
      const persistentMouthOpen = this.consecutiveMouthOpenCount >= this.config.consecutiveDetectionsRequired;
      const persistentAsymmetry = this.consecutiveAsymmetryCount >= this.config.consecutiveDetectionsRequired;

      // Vérifier si l'utilisateur regarde ailleurs (forte asymétrie du visage)
      const lookingAway = faceAsymmetry > 0.4; // Seuil élevé pour détecter quand l'utilisateur regarde ailleurs

      // Déterminer si l'utilisateur fait une grimace
      const isGrimacing = persistentEyesClosed || persistentMouthOpen || persistentAsymmetry || lookingAway;

      // Déterminer la raison spécifique de l'inattention
      let inattentionReason = "";
      if (lookingAway) {
        inattentionReason = "Regard détourné de l'écran";
      } else if (persistentEyesClosed) {
        inattentionReason = "Yeux fermés trop longtemps";
      } else if (persistentMouthOpen) {
        inattentionReason = "Expression faciale inappropriée";
      } else if (persistentAsymmetry) {
        inattentionReason = "Grimace détectée";
      }

      // Préparer les résultats détaillés
      const results = {
        isGrimacing,
        attentionScore,
        eyesClosed: persistentEyesClosed,
        mouthOpen: persistentMouthOpen,
        lookingAway,
        inattentionReason,
        details: {
          eyeOpenPercentage,
          eyeRatio,
          leftEyeRatio,
          rightEyeRatio,
          mouthRatio,
          mouthAsymmetry,
          faceAsymmetry,
          faceSymmetryScore,
          consecutiveEyesClosed: this.consecutiveEyesClosedCount,
          consecutiveMouthOpen: this.consecutiveMouthOpenCount,
          consecutiveAsymmetry: this.consecutiveAsymmetryCount
        }
      };

      // Stocker les derniers résultats
      this.lastResults = results;

      if (this.config.debug) {
        console.log("🔍 Analyse des grimaces:",
          `Attention: ${attentionScore}%`,
          `Yeux fermés persistants: ${persistentEyesClosed} (${this.consecutiveEyesClosedCount}/${this.config.consecutiveDetectionsRequired})`,
          `Bouche ouverte persistante: ${persistentMouthOpen} (${this.consecutiveMouthOpenCount}/${this.config.consecutiveDetectionsRequired})`,
          `Regard détourné: ${lookingAway}`,
          `Grimace: ${isGrimacing}`,
          `Raison: ${inattentionReason || "Aucune"}`
        );
      }

      return results;

    } catch (error) {
      console.error("❌ Erreur lors de l'analyse des grimaces:", error);
      return {
        isGrimacing: false,
        attentionScore: 100,
        eyesClosed: false,
        mouthOpen: false,
        details: {}
      };
    }
  }

  /**
   * Dessine les résultats de l'analyse sur un canvas
   *
   * @param {HTMLCanvasElement} canvas - Canvas sur lequel dessiner
   * @param {Object} landmarks - Points de repère faciaux
   * @param {Object} results - Résultats de l'analyse (optionnel, utilise les derniers résultats si non fourni)
   */
  drawResults(canvas, landmarks, results = null) {
    console.log("🎨 GrimaceDetector.drawResults - Début du dessin");

    // Vérifications de base
    if (!canvas) {
      console.error("❌ Canvas manquant pour le dessin");
      return;
    }

    if (!landmarks) {
      console.error("❌ Points de repère manquants pour le dessin");
      return;
    }

    console.log(`🎨 Canvas: ${canvas.width}x${canvas.height}, ID: ${canvas.id || 'non défini'}`);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error("❌ Impossible d'obtenir le contexte 2D du canvas");
      return;
    }

    // Utiliser les résultats fournis ou les derniers résultats
    const analysisResults = results || this.lastResults;
    if (!analysisResults) {
      console.error("❌ Aucun résultat d'analyse disponible pour le dessin");
      return;
    }

    console.log("🎨 Résultats d'analyse disponibles:", analysisResults);

    try {
      // Effacer le canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Extraire les points des différentes parties du visage
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const mouth = landmarks.getMouth();

      console.log(`🎨 Parties extraites pour le dessin: yeux (${leftEye.length}, ${rightEye.length}), bouche (${mouth.length})`);

      // Couleur en fonction de l'état
      const color = analysisResults.isGrimacing ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 255, 0, 0.8)';

      // Dessiner un cadre autour du visage pour le rendre plus visible
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;

      // Calculer les limites du visage
      const allPoints = [...leftEye, ...rightEye, ...mouth];
      const minX = Math.min(...allPoints.map(p => p.x)) - 20;
      const minY = Math.min(...allPoints.map(p => p.y)) - 20;
      const maxX = Math.max(...allPoints.map(p => p.x)) + 20;
      const maxY = Math.max(...allPoints.map(p => p.y)) + 20;

      // Dessiner le cadre du visage
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

      // Dessiner les yeux
      ctx.strokeStyle = analysisResults.eyesClosed ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 255, 0, 0.8)';
      ctx.lineWidth = 2;

      // Œil gauche
      ctx.beginPath();
      ctx.moveTo(leftEye[0].x, leftEye[0].y);
      for (let i = 1; i < leftEye.length; i++) {
        ctx.lineTo(leftEye[i].x, leftEye[i].y);
      }
      ctx.closePath();
      ctx.stroke();

      // Œil droit
      ctx.beginPath();
      ctx.moveTo(rightEye[0].x, rightEye[0].y);
      for (let i = 1; i < rightEye.length; i++) {
        ctx.lineTo(rightEye[i].x, rightEye[i].y);
      }
      ctx.closePath();
      ctx.stroke();

      // Dessiner la bouche
      ctx.strokeStyle = analysisResults.mouthOpen ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 255, 0, 0.8)';
      ctx.beginPath();
      ctx.moveTo(mouth[0].x, mouth[0].y);
      for (let i = 1; i < mouth.length; i++) {
        ctx.lineTo(mouth[i].x, mouth[i].y);
      }
      ctx.closePath();
      ctx.stroke();

      // Ajouter un fond semi-transparent pour le texte
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(5, 5, 250, 40);

      // Ajouter un texte pour l'ouverture des yeux
      ctx.font = '16px Arial';
      ctx.fillStyle = color;
      ctx.fillText(`Attention: ${analysisResults.attentionScore}%`, 10, 30);

      if (analysisResults.isGrimacing) {
        // Ajouter un fond semi-transparent pour l'avertissement
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(5, 45, 250, 60);

        // Ajouter un texte d'avertissement
        ctx.font = '20px Arial';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
        ctx.fillText('GRIMACE DÉTECTÉE!', 10, 70);

        // Indiquer le type de grimace
        let grimaceType = [];
        if (analysisResults.eyesClosed) grimaceType.push("Yeux fermés");
        if (analysisResults.mouthOpen) grimaceType.push("Bouche ouverte");

        ctx.font = '16px Arial';
        ctx.fillText(grimaceType.join(", "), 10, 95);
      }

      console.log("✅ Dessin terminé avec succès");
    } catch (error) {
      console.error("❌ Erreur lors du dessin des résultats:", error);

      // En cas d'erreur, dessiner un message d'erreur sur le canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '16px Arial';
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.fillText('Erreur lors du dessin des résultats', 10, 30);
      ctx.fillText(error.message, 10, 60);
    }
  }

  /**
   * Modifie la configuration du détecteur
   *
   * @param {Object} newConfig - Nouvelle configuration partielle
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    if (this.config.debug) {
      console.log("🔄 Configuration du GrimaceDetector mise à jour:", this.config);
    }
  }
}

export default GrimaceDetector;
