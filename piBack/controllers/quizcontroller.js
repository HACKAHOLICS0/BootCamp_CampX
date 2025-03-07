const quizModel = require('../Model/Quiz');
const Course = require('../Model/Course');
const mongoose = require("mongoose");
const ObjectID = mongoose.Types.ObjectId;
const UserModel = require('../Model/User');
const { spawn } = require('child_process');
const {PythonShell} = require('python-shell');

// Create controller functions object
const quizController = {};

// Récupérer tous les quiz
quizController.find = async (req, res) => {
  try {
    const quizzes = await quizModel.find({}).populate('course');
    res.status(200).json(quizzes);
  } catch (err) {
    console.error("Find error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Créer un nouveau quiz
quizController.createQuiz = async (req, res) => {
  try {
    const newquiz = new quizModel({
      title: req.body.title,
      chrono: req.body.chrono,
      chronoVal: req.body.chronoVal,
      course: req.body.courseId
    });
    
    const quiz = await newquiz.save();
    
    if (req.body.courseId) {
      await Course.findByIdAndUpdate(req.body.courseId, {
        quiz: quiz._id
      });
    }
    
    res.status(200).json(quiz);
  } catch (err) {
    console.error("Create error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Supprimer un quiz
quizController.deleteQuiz = async (req, res) => {
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
    
    await quizModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Quiz deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Mettre à jour un quiz
quizController.updateQuiz = async (req, res) => {
  try {
    const { id, title, chrono, chronoVal, course } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: "Quiz ID is required" });
    }
    
    const quiz = await quizModel.findById(id);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    
    // Prepare update object
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (chrono !== undefined) updateData.chrono = chrono;
    if (chronoVal !== undefined) updateData.chronoVal = chronoVal;
    
    // Handle course update
    if (course !== undefined && course !== quiz.course) {
      // Remove quiz reference from old course
      if (quiz.course) {
        await Course.findByIdAndUpdate(quiz.course, {
          $unset: { quiz: "" }
        });
      }
      
      // Add quiz reference to new course
      if (course) {
        await Course.findByIdAndUpdate(course, {
          quiz: id
        });
      }
      
      updateData.course = course || null;
    }
    
    // Update quiz
    const updatedQuiz = await quizModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    res.status(200).json(updatedQuiz);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Affecter un quiz à un cours
quizController.assignQuizToCourse = async (req, res) => {
  try {
    const { quizId, courseId } = req.params;
    
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(quizId) || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: "Invalid quiz or course ID" });
    }
    
    // Check if quiz and course exist
    const [quiz, course] = await Promise.all([
      quizModel.findById(quizId),
      Course.findById(courseId)
    ]);
    
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    
    // Update quiz with course reference
    quiz.course = courseId;
    await quiz.save();
    
    // Update course with quiz reference
    course.quiz = quizId;
    await course.save();
    
    res.status(200).json({ message: "Quiz assigned to course successfully" });
  } catch (err) {
    console.error("Assign error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Désaffecter un quiz d'un cours
quizController.unassignQuizFromCourse = async (req, res) => {
  try {
    const { quizId, courseId } = req.params;
    
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(quizId) || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: "Invalid quiz or course ID" });
    }
    
    // Check if quiz and course exist
    const [quiz, course] = await Promise.all([
      quizModel.findById(quizId),
      Course.findById(courseId)
    ]);
    
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    
    // Update quiz to remove course reference
    quiz.course = null;
    await quiz.save();
    
    // Update course to remove quiz reference
    course.quiz = undefined;
    await course.save();
    
    res.status(200).json({ message: "Quiz unassigned from course successfully" });
  } catch (err) {
    console.error("Unassign error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Les autres méthodes existantes restent inchangées
quizController.findQuizByID = async (req, res) => {
  try {
    const quizzes = await quizModel.findOne({ _id: new ObjectID(req.params.id) })
      .populate({
        path: 'Questions',
        populate: {
          path: 'Responses'
        }
      });
    res.json(quizzes);
  } catch (error) {
    res.json({ message: error.message });
  }
};

quizController.addQuestion = async (req, res) => {
  try {
    const QuizId = req.params.id;
    const newQuestion = {
      texte: req.body.texte,
      QuestionType: req.body.QuestionType,
      Responses: req.body.Responses || [],
      correctAnswer: req.body.correctAnswer,
      points: req.body.points || 1,
      code: req.body.code || "",
      language: req.body.language || "",
      activer: true
    };

    const quiz = await quizModel.findOne({ _id: QuizId });
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    quiz.Questions.push(newQuestion);
    await quiz.save();
    
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

quizController.addScore = async (req, res) => {
  try {
    const { userId, quizId, score, duration } = req.body;
    
    // Validate required fields
    if (!userId || !quizId || score === undefined) {
      return res.status(400).json({ error: "userId, quizId, and score are required" });
    }
    
    // Find the user
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Add score to user's scores array
    const newScore = {
      quizId,
      score,
      duration,
      date: new Date()
    };
    
    if (!user.scores) {
      user.scores = [];
    }
    
    user.scores.push(newScore);
    await user.save();
    
    res.status(201).json({ message: "Score added successfully", score: newScore });
  } catch (err) {
    console.error("Add score error:", err);
    res.status(500).json({ error: err.message });
  }
};

quizController.addReponse = async (req, res) => {
  try {
    const { userId, quizId, questionId, optionId, isCorrect } = req.body;
    
    // Add validation as needed
    
    // Record user's response
    // Implementation depends on your data model
    
    res.status(201).json({ message: "Response recorded successfully" });
  } catch (err) {
    console.error("Add response error:", err);
    res.status(500).json({ error: err.message });
  }
};

quizController.DeleteQuestion = async (req, res) => {
  try {
    const QuizId = req.params.idquiz;
    const QuestionId = req.params.idQuestion;

    const quiz = await quizModel.findOne({ _id: QuizId });
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Find the index of the question to delete
    const questionIndex = quiz.Questions.findIndex(
      (q) => q._id.toString() === QuestionId
    );

    if (questionIndex === -1) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Remove the question at the found index
    quiz.Questions.splice(questionIndex, 1);
    await quiz.save();

    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

quizController.findStudent = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(404).send("No Student with that id");

    const student = await UserModel.findById(id);
    res.status(200).json(student);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

quizController.runScriptPython = async (req, res) => {
  const code = req.body.code;
  const studentAnswer = req.body.studentAnswer;
  
  let options = {
    mode: 'text',
    pythonPath: 'python',
    pythonOptions: ['-u'],
    scriptPath: './python/',
    args: [code, studentAnswer]
  };
  
  PythonShell.run('script.py', options, function (err, results) {
    if (err) {
      console.error('Error running Python script:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Process results
    console.log('Python script results:', results);
    
    if (results && results.length > 0) {
      const result = results[0];
      // Assuming the Python script returns "True" or "False" as a string
      const isCorrect = result.toLowerCase() === 'true';
      
      res.json({ isCorrect });
    } else {
      res.status(500).json({ error: 'No result from Python script' });
    }
  });
};

quizController.updateBehavior = async (req, res) => {
  try {
    const { quizId, behavior } = req.body;
    
    const quiz = await quizModel.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    
    // Update behavior properties
    if (behavior.chrono !== undefined) quiz.chrono = behavior.chrono;
    if (behavior.chronoVal !== undefined) quiz.chronoVal = behavior.chronoVal;
    
    await quiz.save();
    
    res.status(200).json({ message: "Quiz behavior updated", quiz });
  } catch (err) {
    console.error("Update behavior error:", err);
    res.status(500).json({ error: err.message });
  }
};

quizController.toggleQuizActivation = async (req, res) => {
  try {
    const quizId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ error: "Invalid quiz ID format" });
    }
    
    const quiz = await quizModel.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    
    // Toggle the isActive property
    quiz.isActive = !quiz.isActive;
    
    // Save the updated quiz
    await quiz.save();
    
    // Return the updated quiz
    res.status(200).json({
      message: `Quiz ${quiz.isActive ? 'activated' : 'deactivated'} successfully`,
      quiz
    });
  } catch (err) {
    console.error("Toggle quiz activation error:", err);
    res.status(500).json({ error: err.message });
  }
};

quizController.toggleQuestionActivation = async (req, res) => {
  try {
    const questionId = req.params.id;
    const { quizId } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ error: "Invalid quiz ID format" });
    }
    
    const quiz = await quizModel.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    
    // Find the question in the quiz
    const question = quiz.Questions.id(questionId);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    
    // Toggle the activer property
    question.activer = !question.activer;
    
    // Save the updated quiz with the updated question
    await quiz.save();
    
    res.status(200).send(`Question ${question.activer ? 'activated' : 'deactivated'}`);
  } catch (err) {
    console.error("Toggle question activation error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Submit a quiz
quizController.submitQuiz = async (req, res) => {
  try {
    const { quizId, answers, timeSpent } = req.body;
    const quiz = await quizModel.findById(quizId);
    
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Calculate score
    let score = 0;
    let totalQuestions = quiz.Questions.length;
    
    for (const questionId in answers) {
      const question = quiz.Questions.find(q => q._id.toString() === questionId);
      if (question && question.correctAnswer === answers[questionId]) {
        score++;
      }
    }

    const percentage = (score / totalQuestions) * 100;

    // Save quiz result
    const result = {
      score,
      totalQuestions,
      percentage,
      timeSpent,
      submittedAt: new Date(),
      answers
    };

    // Update user's quiz results if you have user authentication
    // await UserModel.findByIdAndUpdate(req.user._id, {
    //   $push: { quizResults: result }
    // });

    res.status(200).json(result);
  } catch (err) {
    console.error("Submit error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get quiz for student
quizController.getQuizForStudent = async (req, res) => {
  try {
    const quiz = await quizModel.findById(req.params.id)
      .select('title Questions chronoVal')
      .populate('Questions', 'texte code language QuestionType Responses'); // Exclude correctAnswer

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Remove correct answers from questions
    const safeQuiz = {
      ...quiz.toObject(),
      Questions: quiz.Questions.map(q => ({
        _id: q._id,
        texte: q.texte,
        code: q.code,
        language: q.language,
        QuestionType: q.QuestionType,
        Responses: q.Responses
      }))
    };

    res.status(200).json(safeQuiz);
  } catch (err) {
    console.error("Get quiz error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Export the controller
module.exports = quizController;