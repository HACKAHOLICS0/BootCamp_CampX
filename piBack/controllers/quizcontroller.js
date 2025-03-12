const mongoose = require('mongoose');
const quizModel = require('../Model/Quiz');
const QuizResult = require('../Model/QuizResult');
const Course = require('../Model/Course');

// Récupérer tous les quiz
module.exports.find = async (req, res) => {
  try {
    const quizzes = await quizModel.find()
      .select('title description chrono chronoVal Questions')
      .populate('course', 'title');

    // Format quizzes for frontend
    const formattedQuizzes = quizzes.map(quiz => {
      const quizObj = quiz.toObject();
      return {
        ...quizObj,
        chrono: Boolean(quizObj.chrono),
        chronoVal: quizObj.chrono ? Math.max(1, parseInt(quizObj.chronoVal) || 30) : 0,
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

    res.status(200).json(formattedQuiz);
  } catch (err) {
    console.error("Find quiz by ID error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get quiz for student
module.exports.getQuizForStudent = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid quiz ID" });
    }

    const quiz = await quizModel.findById(req.params.id)
      .select('title description chrono chronoVal Questions')
      .populate({
        path: 'Questions',
        select: 'texte points Responses activer',
        populate: {
          path: 'Responses',
          select: 'texte'
        }
      });

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
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

    if (formattedQuiz.Questions.length === 0) {
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
    const { answers } = req.body;

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({ error: "No answers provided" });
    }

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ error: "Invalid quiz ID" });
    }

    const quiz = await quizModel.findById(quizId)
      .select('Questions chrono chronoVal')
      .populate({
        path: 'Questions',
        select: 'texte points Responses activer',
        populate: {
          path: 'Responses',
          select: 'texte isCorrect'
        }
      });

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
      
      totalPoints += question.points;
      
      if (userAnswer && correctResponse && userAnswer === correctResponse._id.toString()) {
        score += question.points;
      }
    });

    // Prepare result
    const result = {
      score,
      totalPoints,
      totalQuestions: activeQuestions.length,
      percentage: Math.round((score / totalPoints) * 100),
      message: score >= totalPoints * 0.6 ? "Congratulations! You passed the quiz!" : "Keep practicing to improve your score."
    };

    res.status(200).json(result);
  } catch (err) {
    console.error("Submit quiz error:", err);
    res.status(500).json({ error: err.message });
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
      .select('title description chrono chronoVal Questions')
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
        const { title, chrono, chronoVal, course } = req.body;

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

        const newQuiz = new quizModel({
            title,
            chrono: isChrono,
            chronoVal: timerValue,
            course,
            Questions: []
        });

        const savedQuiz = await newQuiz.save();
        
        // Ajouter le quiz au tableau quizzes du cours
        await Course.findByIdAndUpdate(
            course,
            { $push: { quizzes: savedQuiz._id } },
            { new: true }
        );
        
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
