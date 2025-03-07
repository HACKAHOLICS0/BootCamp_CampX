const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizcontroller');

// Routes pour la gestion des quiz
router.get("/findall", quizController.find);
router.post("/:idModule/create", quizController.createQuiz);
router.delete("/delete/:id", quizController.deleteQuiz);
router.put("/update", quizController.updateQuiz);

// Student quiz routes
router.get("/student/:id", quizController.getQuizForStudent);
router.post("/submit", quizController.submitQuiz);

// Routes pour l'affectation des quiz aux cours
router.post('/assign/:quizId/course/:courseId', quizController.assignQuizToCourse);
router.post('/unassign/:quizId/course/:courseId', quizController.unassignQuizFromCourse);

// Routes pour les scores et réponses
router.post('/score/add', quizController.addScore);
router.post('/reponse/add', quizController.addReponse);

// Route pour activer/désactiver un quiz
router.patch('/activate/:id', quizController.toggleQuizActivation);

// Routes pour les questions
router.get("/questions/:id", quizController.findQuizByID);
router.post("/addQuestion/:id", quizController.addQuestion);
router.delete("/deleteQuestion/:idquiz/:idQuestion", quizController.DeleteQuestion);
router.put("/updateQuestion", quizController.updateQuiz);
router.patch("/activateQuestion/:id", quizController.toggleQuestionActivation);
router.post("/runScriptPython", quizController.runScriptPython);
router.patch("/updateBehavior", quizController.updateBehavior);

module.exports = router;