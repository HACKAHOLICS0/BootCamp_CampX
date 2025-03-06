const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

// Routes pour la gestion des quiz
router.get("/findall", quizController.find);
router.post("/:idModule/create", quizController.createQuiz);
router.delete("/delete/:id", quizController.deleteQuiz);
router.put("/update", quizController.updateQuiz);
router.get("/questions/:id", quizController.findQuizByID);
router.post("/addQuestion/:id", quizController.addQuestion);
router.delete("/deleteQuestion/:idquiz/:idQuestion", quizController.DeleteQuestion);
router.put("/updateQuestion", quizController.updateQuiz);
router.patch("/activateQuestion/:id", quizController.toggleQuestionActivation);
router.post("/runScriptPython", quizController.runScriptPython);
router.patch("/updateBehavior", quizController.updateBehavior);

// Routes pour l'affectation des quiz aux cours
router.post('/assign/:quizId/course/:courseId', quizController.assignQuizToCourse);
router.post('/unassign/:quizId/course/:courseId', quizController.unassignQuizFromCourse);

// Routes pour les scores et réponses
router.post('/score/add', quizController.addScore);
router.post('/reponse/add', quizController.addReponse);
router.get('/student/:id', quizController.findStudent);

// Route pour activer/désactiver un quiz
router.patch('/activate/:id', quizController.toggleQuizActivation);

module.exports = router;