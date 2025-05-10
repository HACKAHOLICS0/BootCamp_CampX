const mongoose = require('mongoose');
const quizModel = require('../Model/Quiz');
const QuizResult = require('../Model/QuizResult');
const Course = require('../Model/Course');
const User = require('../Model/User');
const certificateController = require('./certificateController');
const fs = require('fs');
const path = require('path');

// Récupérer tous les quiz
module.exports.find = async (req, res) => {
  try {
    const quizzes = await quizModel.find()
      .select('title description chrono chronoVal Questions isFinalQuiz')
      .populate('course', 'title');

    // Format quizzes for frontend
    const formattedQuizzes = quizzes.map(quiz => {
      const quizObj = quiz.toObject();
      return {
        ...quizObj,
        chrono: Boolean(quizObj.chrono),
        chronoVal: quizObj.chrono ? Math.max(1, parseInt(quizObj.chronoVal) || 30) : 0,
        isFinalQuiz: Boolean(quizObj.isFinalQuiz),
        questionCount: quiz.Questions.filter(q => q.activer).length
      };
    });

    res.status(200).json(formattedQuizzes);
  } catch (err) {
    console.error("Find all quizzes error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get quiz by ID
module.exports.findById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid quiz ID" });
    }

    const quiz = await quizModel.findById(req.params.id)
      .populate('course', 'title');

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Format quiz for frontend
    const formattedQuiz = quiz.toObject();
    formattedQuiz.chrono = Boolean(formattedQuiz.chrono);
    formattedQuiz.chronoVal = formattedQuiz.chrono ? Math.max(1, parseInt(formattedQuiz.chronoVal) || 30) : 0;
    formattedQuiz.isFinalQuiz = Boolean(formattedQuiz.isFinalQuiz);

    res.status(200).json(formattedQuiz);
  } catch (err) {
    console.error("Find quiz by ID error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get quiz for student
module.exports.getQuizForStudent = async (req, res) => {
  try {
    console.log("Getting quiz for student, quiz ID:", req.params.id);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log("Invalid quiz ID format");
      return res.status(400).json({ error: "Invalid quiz ID" });
    }

    const quiz = await quizModel.findById(req.params.id)
      .select('title description chrono chronoVal Questions isFinalQuiz course')
      .populate({
        path: 'Questions',
        select: 'texte points Responses activer',
        populate: {
          path: 'Responses',
          select: 'texte'
        }
      });

    console.log("Quiz found:", quiz);

    if (!quiz) {
      console.log("Quiz not found");
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Vérifier si c'est un quiz final et si l'utilisateur a complété tous les autres quiz
    if (quiz.isFinalQuiz && quiz.course) {
      console.log("C'est un quiz final, vérification des prérequis...");

      // Récupérer tous les quiz du cours
      const courseQuizzes = await quizModel.find({
        course: quiz.course,
        _id: { $ne: quiz._id },
        isFinalQuiz: false
      });

      if (courseQuizzes.length > 0) {
        // Récupérer les résultats de quiz de l'utilisateur
        const quizResults = await QuizResult.find({
          user: req.user._id,
          quiz: { $in: courseQuizzes.map(q => q._id) }
        });

        // Créer un ensemble des IDs de quiz complétés
        const completedQuizIds = new Set(quizResults.map(result => result.quiz.toString()));

        // Vérifier si tous les quiz standards ont été complétés
        const allQuizzesCompleted = courseQuizzes.every(q =>
          completedQuizIds.has(q._id.toString())
        );

        if (!allQuizzesCompleted) {
          console.log("L'utilisateur n'a pas complété tous les quiz standards");
          return res.status(403).json({
            error: "Vous devez compléter tous les autres quiz du cours avant d'accéder au quiz final"
          });
        }

        console.log("L'utilisateur a complété tous les quiz standards, accès au quiz final autorisé");
      }
    }

    // Format quiz for student view
    const formattedQuiz = {
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      chrono: Boolean(quiz.chrono),
      chronoVal: quiz.chrono ? Math.max(1, parseInt(quiz.chronoVal) || 30) : 0,
      Questions: quiz.Questions.filter(q => q.activer && q.Responses && q.Responses.length > 0).map(q => ({
        _id: q._id,
        texte: q.texte,
        points: q.points,
        Responses: q.Responses.map(r => ({
          _id: r._id,
          texte: r.texte
        }))
      }))
    };

    console.log("Formatted quiz:", formattedQuiz);

    if (formattedQuiz.Questions.length === 0) {
      console.log("No active questions found");
      return res.status(404).json({ error: "No active questions available for this quiz" });
    }

    res.status(200).json(formattedQuiz);
  } catch (err) {
    console.error("Get quiz for student error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Submit quiz
module.exports.submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers, answerTimes, timeSpent, fraudDetected, fraudEvents } = req.body;

    console.log("Received submission data:", {
      quizId,
      answers: answers ? Object.keys(answers).length : 0,
      answerTimes: answerTimes ? Object.keys(answerTimes).length : 0,
      timeSpent,
      fraudDetected: !!fraudDetected,
      fraudEvents: Array.isArray(fraudEvents) ? fraudEvents.length : (fraudEvents ? 1 : 0)
    });

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({ error: "No answers provided" });
    }

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ error: "Invalid quiz ID" });
    }

    const quiz = await quizModel.findById(quizId)
      .select('Questions chrono chronoVal course isFinalQuiz title')
      .populate({
        path: 'Questions',
        select: 'texte points Responses activer',
        populate: {
          path: 'Responses',
          select: 'texte isCorrect'
        }
      });

    console.log("Found quiz:", quiz);

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const activeQuestions = quiz.Questions.filter(q => q.activer && q.Responses && q.Responses.length > 0);

    if (activeQuestions.length === 0) {
      return res.status(400).json({ error: "No active questions found in the quiz" });
    }

    let score = 0;
    let totalPoints = 0;

    // Calculate score
    activeQuestions.forEach(question => {
      const userAnswer = answers[question._id];
      const correctResponse = question.Responses.find(r => r.isCorrect);

      totalPoints += question.points || 1;

      if (userAnswer && correctResponse && userAnswer === correctResponse._id.toString()) {
        score += question.points || 1;
      }
    });

    // Détection de fraude
    const fraudDetection = {
      isSuspicious: false,
      reasons: []
    };

    // Vérifier si c'est un quiz final
    const isFinalQuiz = Boolean(quiz.isFinalQuiz);

    // Pour les quiz non-finaux, vérifier le temps de réponse trop rapide
    if (!isFinalQuiz) {
      // Vérification du temps de réponse trop rapide (moins de 2 secondes par question)
      const MIN_TIME_PER_QUESTION = 2;

      // Calculer le temps moyen par question
      const answerTimeValues = Object.values(answerTimes || {});
      const totalAnswerTime = answerTimeValues.reduce((sum, time) => sum + time, 0);
      const averageTimePerQuestion = answerTimeValues.length > 0 ? totalAnswerTime / answerTimeValues.length : 0;

      console.log("Temps moyen par question:", averageTimePerQuestion, "secondes");

      // Vérifier si plus de 50% des réponses sont trop rapides
      const suspiciousFastAnswers = answerTimeValues.filter(time => time < MIN_TIME_PER_QUESTION);
      const suspiciousPercentage = (suspiciousFastAnswers.length / answerTimeValues.length) * 100;

      console.log("Pourcentage de réponses trop rapides:", suspiciousPercentage, "%");

      // Ne signaler une fraude que si plus de 50% des réponses sont trop rapides
      if (suspiciousFastAnswers.length > 0 && suspiciousPercentage > 50) {
        fraudDetection.isSuspicious = true;
        fraudDetection.reasons.push('TOO_FAST');
      }
    }

    // Si une fraude vidéo a été détectée par le frontend (pour tous les quiz)
    if (fraudDetected) {
      fraudDetection.isSuspicious = true;
      fraudDetection.reasons.push('VIDEO_FRAUD');
      console.log("Fraude vidéo détectée:", fraudDetected);
      console.log("Type de quiz:", isFinalQuiz ? "Quiz final" : "Quiz normal");
    } else {
      console.log("Aucune fraude vidéo détectée");
    }

    try {
      // Vérifier si l'utilisateur est authentifié
      if (!req.user || !req.user._id) {
        console.error("Utilisateur non authentifié ou ID utilisateur manquant");
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      // Préparer les données pour le résultat du quiz
      const percentage = Math.round((score / totalPoints) * 100);

      // Créer le résultat du quiz
      const quizResult = new QuizResult({
        user: req.user._id,
        quiz: quizId,
        score,
        totalPoints,
        percentage,
        answers,
        timeSpent: Number(timeSpent) || 0,
        answerTimes: answerTimes || {},
        fraudDetection: {
          // Pour les quiz finaux, on ne considère que la fraude vidéo
          isSuspicious: isFinalQuiz
            ? !!fraudDetected // Pour les quiz finaux, uniquement la fraude vidéo
            : (!!fraudDetected || !!fraudDetection.isSuspicious), // Pour les quiz normaux, toutes les fraudes

          // Pour les quiz finaux, uniquement VIDEO_FRAUD si détecté
          // Pour les quiz normaux, toutes les raisons de fraude
          reasons: isFinalQuiz
            ? (fraudDetected ? ['VIDEO_FRAUD'] : [])
            : (
                fraudDetected
                  ? ['VIDEO_FRAUD']
                  : (
                      Array.isArray(fraudDetection.reasons)
                        ? fraudDetection.reasons.filter(r => r && ['TOO_FAST', 'INCONSISTENT_TIME', 'UNREALISTIC_SCORE'].includes(r))
                        : []
                    )
              )
        }
      });

      console.log("Saving quiz result with fraud detection:", {
        isSuspicious: quizResult.fraudDetection.isSuspicious,
        reasons: quizResult.fraudDetection.reasons,
        isFinalQuiz: isFinalQuiz,
        fraudDetected: fraudDetected,
        timeSpent: timeSpent,
        answerTimesCount: Object.keys(answerTimes || {}).length
      });

      await quizResult.save();
      console.log("Quiz result saved successfully");

      // Afficher les temps de réponse pour le débogage
      if (Object.keys(answerTimes || {}).length > 0) {
        console.log("Temps de réponse par question:");
        Object.entries(answerTimes || {}).forEach(([questionId, time]) => {
          console.log(`- Question ${questionId}: ${time} secondes`);
        });
      }

      // Mettre à jour la progression de l'utilisateur dans le cours
      if (quiz.course) {
        const user = await User.findById(req.user._id);
        const courseProgress = user.enrolledCourses.find(
          course => course.courseId.toString() === quiz.course.toString()
        );

        if (courseProgress) {
          // Vérifier si le quiz n'a pas déjà été complété
          const existingResult = await QuizResult.findOne({
            user: req.user._id,
            quiz: quizId
          });

          if (!existingResult) {
            courseProgress.quizzesCompleted += 1;
            courseProgress.progress = Math.round(
              (courseProgress.quizzesCompleted / quiz.Questions.length) * 100
            );
            await user.save();
          }
        }
      }

      // Préparer la réponse
      const result = {
        score,
        totalPoints,
        totalQuestions: activeQuestions.length,
        percentage,
        fraudDetection,
        isFinalQuiz: Boolean(quiz.isFinalQuiz),
        message: isFinalQuiz
          ? (fraudDetection.reasons.includes('VIDEO_FRAUD'))
            ? "Fraude détectée par la caméra pendant le quiz. Aucun certificat ne sera délivré."
            : score >= totalPoints * 0.6
              ? "Félicitations! Vous avez réussi le quiz final!"
              : "Vous n'avez pas obtenu le score minimum requis pour le certificat."
          : fraudDetection.isSuspicious
            ? "Attention: Des comportements suspects ont été détectés lors de la passation du quiz."
            : score >= totalPoints * 0.6
              ? "Félicitations! Vous avez réussi le quiz!"
              : "Continuez à vous entraîner pour améliorer votre score."
      };

      // Si c'est un quiz final et que le score est suffisant (>= 50%), générer un certificat
      console.log("Vérification pour la génération de certificat:");
      console.log("- Quiz est final:", Boolean(quiz.isFinalQuiz));
      console.log("- Pourcentage:", percentage, ">=", 50, "?", percentage >= 50);
      console.log("- Fraude détectée:", fraudDetection.isSuspicious);

      // Pour les quiz finaux, vérifier si une fraude vidéo a été détectée
      if (isFinalQuiz && fraudDetected) {
        console.log("Fraude vidéo détectée, pas de certificat généré");
        result.message = "Fraude détectée par la caméra pendant le quiz. Aucun certificat ne sera délivré.";
      }

      // Pour les quiz finaux, vérifier uniquement la fraude vidéo (pas les réponses trop rapides)
      // Ajouter des logs détaillés pour comprendre pourquoi le certificat n'est pas généré
      console.log("Vérification des conditions pour la génération du certificat:");
      console.log("- Quiz est final:", Boolean(quiz.isFinalQuiz));
      console.log("- Pourcentage:", percentage, ">=", 50, "?", percentage >= 50);
      console.log("- Fraude vidéo détectée:", fraudDetected);

      // Générer un certificat uniquement si c'est un quiz final, le score est >= 50% et aucune fraude n'est détectée
      console.log("=== VÉRIFICATION FINALE DES CONDITIONS POUR LA GÉNÉRATION DU CERTIFICAT ===");
      console.log("- quiz.isFinalQuiz:", quiz.isFinalQuiz);
      console.log("- isFinalQuiz (variable):", isFinalQuiz);
      console.log("- percentage >= 50:", percentage >= 50);
      console.log("- !fraudDetected:", !fraudDetected);
      console.log("- Toutes les conditions remplies:", Boolean(quiz.isFinalQuiz) && percentage >= 50 && !fraudDetected);

      if (Boolean(quiz.isFinalQuiz) && percentage >= 50 && !fraudDetected) {
        console.log("Conditions remplies pour générer un certificat");
        try {
          console.log("Tentative de génération de certificat pour l'utilisateur:", req.user._id);
          console.log("Quiz:", {
            id: quiz._id,
            title: quiz.title,
            isFinalQuiz: quiz.isFinalQuiz,
            course: quiz.course,
            courseId: quiz.course ? quiz.course.toString() : 'non défini'
          });

          // Vérifier si le quiz a un cours associé
          if (!quiz.course) {
            console.error("Le quiz n'a pas de cours associé, impossible de générer un certificat");
            result.message = "Impossible de générer un certificat pour ce quiz (pas de cours associé)";
            result.certificateError = "Le quiz n'est pas associé à un cours";
          } else {
            console.log("Cours associé trouvé, génération du certificat...");
            console.log("Génération du certificat pour un quiz final avec score >= 50% et sans fraude");

            try {
              const certificate = await certificateController.generateCertificate(
                req.user._id,
                quizId,
                score,
                percentage
              );

              console.log("Certificat généré avec succès:", certificate._id);
              result.certificate = {
                id: certificate._id,
                number: certificate.certificateNumber,
                message: "Félicitations! Vous avez obtenu un certificat pour ce cours."
              };

              // Mettre à jour le message principal
              result.message = "Félicitations! Vous avez réussi le quiz et obtenu un certificat!";

              // Ajouter un lien vers le certificat
              result.certificateUrl = `/api/certificates/${certificate._id}/pdf`;
            } catch (certError) {
              console.error("Erreur lors de la génération du certificat:", certError);
              result.certificateError = "Erreur lors de la génération du certificat: " + certError.message;
            }
          }
        } catch (certError) {
          console.error("Erreur lors de la génération du certificat:", certError);
          // Ne pas bloquer la réponse si la génération du certificat échoue
          result.certificateError = "Une erreur est survenue lors de la génération du certificat";
        }
      } else {
        console.log("Conditions non remplies pour générer un certificat");
        if (Boolean(quiz.isFinalQuiz)) {
          if (percentage < 50) {
            result.certificateError = "Score insuffisant pour obtenir un certificat (minimum 50%)";
          } else if (fraudDetected) {
            result.certificateError = "Fraude détectée pendant le quiz, certificat non généré";
          } else {
            result.certificateError = "Conditions non remplies pour générer un certificat";
          }
        }
      }

      console.log("Sending response:", {
        score: result.score,
        totalPoints: result.totalPoints,
        percentage: result.percentage,
        isFinalQuiz: result.isFinalQuiz,
        fraudDetection: result.fraudDetection,
        certificate: result.certificate ? "Présent" : "Absent",
        certificateError: result.certificateError || "Aucune erreur"
      });

      res.status(200).json(result);
    } catch (saveError) {
      console.error("Error saving quiz result:", saveError);
      return res.status(500).json({ error: "Erreur lors de l'enregistrement du résultat du quiz" });
    }
  } catch (err) {
    console.error("Submit quiz error:", err);
    return res.status(500).json({ error: "Erreur lors de la soumission du quiz" });
  }
};

// Get quizzes by course
module.exports.getQuizzesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: "Invalid course ID" });
    }

    const quizzes = await quizModel.find({ course: courseId })
      .select('title description chrono chronoVal Questions isFinalQuiz')
      .populate({
        path: 'Questions',
        match: { activer: true },
        select: 'points'
      });

    // Format quizzes for frontend
    const formattedQuizzes = quizzes.map(quiz => ({
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      chrono: Boolean(quiz.chrono),
      chronoVal: quiz.chrono ? Math.max(1, parseInt(quiz.chronoVal) || 30) : 0,
      isFinalQuiz: Boolean(quiz.isFinalQuiz),
      questionCount: quiz.Questions.length,
      totalPoints: quiz.Questions.reduce((sum, q) => sum + q.points, 0)
    }));

    res.status(200).json(formattedQuizzes);
  } catch (err) {
    console.error("Get quizzes by course error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Créer un nouveau quiz
module.exports.create = async (req, res) => {
    try {
        const { title, chrono, chronoVal, course, isFinalQuiz } = req.body;

        if (!title) {
            return res.status(400).json({ error: "Quiz title is required" });
        }

        if (!mongoose.Types.ObjectId.isValid(course)) {
            return res.status(400).json({ error: "Invalid course ID" });
        }

        // Verify course exists
        const courseExists = await Course.findById(course);
        if (!courseExists) {
            return res.status(404).json({ error: "Course not found" });
        }

        // Ensure proper timer values
        const isChrono = Boolean(chrono);
        const timerValue = isChrono ? Math.max(1, parseInt(chronoVal) || 30) : 0;
        const isQuizFinal = Boolean(isFinalQuiz);

        const newQuiz = new quizModel({
            title,
            chrono: isChrono,
            chronoVal: timerValue,
            course,
            isFinalQuiz: isQuizFinal,
            Questions: []
        });

        const savedQuiz = await newQuiz.save();
        console.log("Quiz créé avec succès:", savedQuiz._id);

        // Mettre à jour le cours avec le nouveau quiz en utilisant findByIdAndUpdate
        const updatedCourse = await Course.findByIdAndUpdate(
            course,
            { $push: { quizzes: savedQuiz._id } },
            { new: true }
        );

        if (!updatedCourse) {
            console.error("Erreur lors de la mise à jour du cours");
            // Supprimer le quiz si la mise à jour du cours échoue
            await quizModel.findByIdAndDelete(savedQuiz._id);
            return res.status(500).json({ error: "Failed to update course with new quiz" });
        }

        console.log("Cours mis à jour avec le nouveau quiz");

        // Si c'est un quiz final, mettre à jour le champ finalQuiz du cours
        if (isQuizFinal) {
            await Course.findByIdAndUpdate(
                course,
                { finalQuiz: savedQuiz._id },
                { new: true }
            );
            console.log("Quiz défini comme quiz final du cours");
        }

        // Populate course details for response
        const populatedQuiz = await quizModel.findById(savedQuiz._id)
            .populate('course', 'title');

        res.status(201).json(populatedQuiz);
    } catch (err) {
        console.error("Create quiz error:", err);
        res.status(500).json({ error: err.message });
    }
};

// Update quiz
module.exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid quiz ID" });
    }

    const quiz = await quizModel.findById(id);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Handle timer updates
    if ('chrono' in updates) {
      quiz.chrono = Boolean(updates.chrono);
      if (quiz.chrono && updates.chronoVal) {
        quiz.chronoVal = Math.max(1, parseInt(updates.chronoVal) || 30);
      } else if (!quiz.chrono) {
        quiz.chronoVal = 0;
      }
    } else if ('chronoVal' in updates && quiz.chrono) {
      quiz.chronoVal = Math.max(1, parseInt(updates.chronoVal) || 30);
    }

    // Handle isFinalQuiz updates
    if ('isFinalQuiz' in updates) {
      const isQuizFinal = Boolean(updates.isFinalQuiz);
      quiz.isFinalQuiz = isQuizFinal;

      // Si c'est un quiz final, mettre à jour le champ finalQuiz du cours
      if (isQuizFinal && quiz.course) {
        await Course.findByIdAndUpdate(
          quiz.course,
          { finalQuiz: quiz._id },
          { new: true }
        );
      }
    }

    // Update other allowed fields
    const allowedUpdates = ['title', 'description', 'Questions'];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        quiz[key] = updates[key];
      }
    });

    const updatedQuiz = await quiz.save();
    res.status(200).json(updatedQuiz);
  } catch (err) {
    console.error("Update quiz error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Delete quiz
module.exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid quiz ID" });
    }

    const quiz = await quizModel.findById(id);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // If quiz is assigned to a course, remove the reference
    if (quiz.course) {
      await Course.findByIdAndUpdate(quiz.course, {
        $pull: { quizzes: id }
      });
    }

    // Delete quiz results
    await QuizResult.deleteMany({ quiz: id });

    // Delete quiz using findByIdAndDelete instead of remove()
    await quizModel.findByIdAndDelete(id);

    res.status(200).json({ message: "Quiz deleted successfully" });
  } catch (err) {
    console.error("Delete quiz error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Add question to quiz
module.exports.addQuestion = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid quiz ID" });
    }

    const quiz = await quizModel.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const newQuestion = {
      texte: req.body.question,
      Responses: req.body.options.map(opt => ({
        texte: opt.text,
        isCorrect: opt.isCorrect
      })),
      points: req.body.points || 1,
      activer: true
    };

    if (!Array.isArray(quiz.Questions)) {
      quiz.Questions = [];
    }

    quiz.Questions.push(newQuestion);
    await quiz.save();

    res.status(201).json(quiz);
  } catch (err) {
    console.error("Add question error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Remove question from quiz
module.exports.removeQuestion = async (req, res) => {
  try {
    const { id, questionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ error: "Invalid quiz or question ID" });
    }

    const quiz = await quizModel.findById(id);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    quiz.Questions = quiz.Questions.filter(q => q._id.toString() !== questionId);
    const updatedQuiz = await quiz.save();

    res.status(200).json(updatedQuiz);
  } catch (err) {
    console.error("Remove question error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Affecter un quiz à un cours
module.exports.assignQuizToCourse = async (req, res) => {
  try {
    const { quizId, courseId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(quizId) || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: "Invalid quiz or course ID" });
    }

    // Find quiz and course
    const quiz = await quizModel.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // If quiz is already assigned to another course, remove the reference
    if (quiz.course && quiz.course.toString() !== courseId) {
      const previousCourse = await Course.findById(quiz.course);
      if (previousCourse) {
        previousCourse.quiz = undefined;
        await previousCourse.save();
      }
    }

    // If course already has a quiz, remove the reference from that quiz
    if (course.quiz && course.quiz.toString() !== quizId) {
      const previousQuiz = await quizModel.findById(course.quiz);
      if (previousQuiz) {
        previousQuiz.course = undefined;
        await previousQuiz.save();
      }
    }

    // Update quiz with course reference
    quiz.course = courseId;
    await quiz.save();

    // Update course with quiz reference
    course.quiz = quizId;
    await course.save();

    // Return updated quiz with populated course
    const updatedQuiz = await quiz.populate('course', 'title');
    res.status(200).json(updatedQuiz);
  } catch (err) {
    console.error("Assign error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Désaffecter un quiz d'un cours
module.exports.unassignQuizFromCourse = async (req, res) => {
  try {
    const { quizId, courseId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(quizId) || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: "Invalid quiz or course ID" });
    }

    const quiz = await quizModel.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Remove references only if they match
    if (quiz.course && quiz.course.toString() === courseId) {
      quiz.course = undefined;
      await quiz.save();
    }

    if (course.quiz && course.quiz.toString() === quizId) {
      course.quiz = undefined;
      await course.save();
    }

    res.status(200).json({ message: "Quiz unassigned successfully" });
  } catch (err) {
    console.error("Unassign error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Les autres méthodes existantes restent inchangées
module.exports.findQuizByID=async(req,res)=>{
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(400).send("ID unknown : " + req.params.id);
    try {
      const quiz = await quizModel.findById(req.params.id)
        .populate('course', 'title description');

      if (!quiz) {
        return res.status(404).send("Quiz not found");
      }

      res.status(200).send(quiz);
    } catch (err) {
      console.error("Find by ID error:", err);
      res.status(500).send({ error: err.message });
    }
}

module.exports.addScore = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.body.idQuiz))
    return res.status(400).send("ID unknown : " + req.body.idQuiz);
   console.log(req.body);

    quizModel.findByIdAndUpdate(
      req.body.idQuiz,
        {
          $push: {
            Results: {
               idUser:req.body.idUser,
               Note:req.body.score,
               time:req.body.time,
               totalClicksofmap:req.body.totalClicksofmap
            },
          },
        },
        { new: true },
        (err, docs) => {
          if (!err) return res.send(docs);
          else return res.status(400).send(err);
        }
      )


};

module.exports.addReponse = async (req, res) => {

  if (!mongoose.Types.ObjectId.isValid(req.body.idQuiz))
    return res.status(400).send("ID unknown : " + req.body.idQuiz);
   qui= await quizModel.findOne({_id:req.body.idQuiz})
   question=qui.Questions.find(e=>e._id==req.body.idQuestion);
   reponse=question.Responses.find(e=>e._id==req.body.idResponse)
   reponse.idUsers.push(req.body.idUser)
   qui.save();
   return res.send(qui);


};

module.exports.DeleteQuestion = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(400).send("ID unknown : " + req.params.id);

  try {
    const updatedQuiz = await quizModel.findByIdAndUpdate(
      req.params.id,
      {
        $pull: { Questions: { _id: req.params.idQuestion } }
      },
      { new: true }  // Cette option permet de renvoyer le document mis à jour
    );

    if (!updatedQuiz) {
      return res.status(404).send("Quiz not found");
    }

    return res.send(updatedQuiz); // Renvoie le quiz mis à jour
  } catch (err) {
    console.error("Error deleting question:", err);
    return res.status(400).send("Error deleting question");
  }
};

module.exports.findStudent =  async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.studentid))
  return res.status(400).send("ID unknown : " + req.params.idModule);
  UserModel.findById(req.params.studentid,(err, docs) => {
    if (!err) res.send(docs);
    else console.log("Error to get data : " + err);
  })
};

module.exports.runScriptPython =async(req,res)=>{
  /*const pyProg = spawn('python', ['public/script.py',req.body.nbclicks,"20","30"]);
  pyProg.stdout.on('data', function(data) {

    console.log(data.toString());
    res.send(data);

});*/


let options = {
  mode: 'text',
  pythonPath: 'python' ,
  pythonOptions: ['-u'], // get print results in real-time
  scriptPath: 'public',
  args: [req.body.click,req.body.time_s,req.body.nbr_mod,req.body.Note]
};
PythonShell.run('Behavior.py', options, function (err, results) {
  if (err) throw err;
  // results is an array consisting of messages collected during execution
  console.log('results: %j', results);
  res.send(results[0])
});
}

module.exports.updateBehavior = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.body.idquiz))
    return res.status(400).send("ID unknown : " + req.body.idquiz);
   qui= await quizModel.findOne({_id:req.body.idquiz})
   resultat=qui.Results.find(e=>e.idUser==req.body.userId);
   resultat.Behavior=req.body.behavior;

   qui.save();
   return res.send(qui);


};

module.exports.toggleQuizActivation = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).send("ID unknown : " + req.params.id);
  }

  // Toggle the 'activer' field (if it's true, set to false, and vice versa)
  const quiz = await quizModel.findById(req.params.id);
  if (!quiz) {
    return res.status(404).send("Quiz not found");
  }

  quiz.activer = !quiz.activer; // Change the state of 'activer'

  // Save the updated quiz
  await quiz.save();

  res.status(200).send(`Quiz ${quiz.activer ? 'activated' : 'deactivated'}`);
};

module.exports.toggleQuestionActivation = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.idQuiz) || !mongoose.Types.ObjectId.isValid(req.params.idQuestion)) {
    return res.status(400).send("ID unknown");
  }

  const quiz = await quizModel.findById(req.params.idQuiz);
  if (!quiz) {
    return res.status(404).send("Quiz not found");
  }

  const question = quiz.Questions.id(req.params.idQuestion);
  if (!question) {
    return res.status(404).send("Question not found");
  }

  // Toggle the 'activer' field of the question
  question.activer = !question.activer; // Change the state of 'activer'

  // Save the updated quiz with the updated question
  await quiz.save();

  res.status(200).send(`Question ${question.activer ? 'activated' : 'deactivated'}`);
};

module.exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await quizModel.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    if (quiz.course) {
      await Course.findByIdAndUpdate(quiz.course, {
        $unset: { quiz: "" }
      });
    }

    await quiz.deleteOne();
    res.status(200).json({ message: "Quiz deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports.updateQuiz = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid quiz ID" });
    }

    const quiz = await quizModel.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const updateData = {
      title: req.body.title || quiz.title,
      description: req.body.description || quiz.description,
      chronoVal: req.body.chronoVal || quiz.chronoVal
    };

    if (req.body.courseId) {
      if (!mongoose.Types.ObjectId.isValid(req.body.courseId)) {
        return res.status(400).json({ error: "Invalid course ID" });
      }

      // Handle course change
      if (quiz.course && quiz.course.toString() !== req.body.courseId) {
        // Remove quiz from old course
        await Course.findByIdAndUpdate(quiz.course, {
          $unset: { quiz: "" }
        });
      }

      // Update new course
      const newCourse = await Course.findById(req.body.courseId);
      if (!newCourse) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Remove quiz from previous course if exists
      if (newCourse.quiz && newCourse.quiz.toString() !== quiz._id.toString()) {
        const previousQuiz = await quizModel.findById(newCourse.quiz);
        if (previousQuiz) {
          previousQuiz.course = undefined;
          await previousQuiz.save();
        }
      }

      newCourse.quiz = quiz._id;
      await newCourse.save();
      updateData.course = req.body.courseId;
    }

    const updatedQuiz = await quizModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('course', 'title description');

    res.status(200).json(updatedQuiz);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports.deleteQuestion = async (req, res) => {
  try {
    const { quizId, questionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(quizId) || !mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ error: "Invalid quiz or question ID" });
    }

    const quiz = await quizModel.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    quiz.Questions = quiz.Questions.filter(q => q._id.toString() !== questionId);
    await quiz.save();

    res.status(200).json({ message: "Question deleted successfully" });
  } catch (err) {
    console.error("Delete question error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports.updateQuestion = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid quiz ID" });
    }

    const quiz = await quizModel.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const questionIndex = quiz.Questions.findIndex(q => q._id.toString() === req.body.questionId);
    if (questionIndex === -1) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Update question fields
    const question = quiz.Questions[questionIndex];
    question.texte = req.body.question || question.texte;
    question.Responses = req.body.options.map(opt => ({
      texte: opt.text,
      isCorrect: opt.isCorrect
    })) || question.Responses;
    question.points = req.body.points || question.points;
    question.activer = req.body.activer !== undefined ? req.body.activer : question.activer;

    await quiz.save();
    res.status(200).json(quiz);
  } catch (err) {
    console.error("Update question error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get quiz results for a user
module.exports.getQuizResults = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ error: "Invalid quiz ID" });
    }

    const results = await QuizResult.find({
      quiz: quizId,
      user: userId
    }).sort({ submittedAt: -1 });

    res.status(200).json(results);
  } catch (err) {
    console.error("Get quiz results error:", err);
    res.status(500).json({ error: err.message });
  }
};