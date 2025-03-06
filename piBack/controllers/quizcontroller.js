const quizModel = require('../Model/Quiz');
const Course = require('../Model/Course');
const mongoose = require("mongoose");
const ObjectID = mongoose.Types.ObjectId;
const UserModel = require('../Model/User');
const { spawn } = require('child_process');
const {PythonShell} = require('python-shell');

// Récupérer tous les quiz
module.exports.find = async (req, res) => {
  try {
    const quizzes = await quizModel.find({}).populate('course');
    res.status(200).json(quizzes);
  } catch (err) {
    console.error("Find error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Créer un nouveau quiz
module.exports.createQuiz = async (req, res) => {
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

// Mettre à jour un quiz
module.exports.updateQuiz = async (req, res) => {
  try {
    const updatedRecord = {};
    
    if (req.body.title) updatedRecord.title = req.body.title;
    if (req.body.chrono !== undefined) updatedRecord.chrono = req.body.chrono;
    if (req.body.chronoVal !== undefined) updatedRecord.chronoVal = req.body.chronoVal;
    if (req.body.courseId) updatedRecord.course = req.body.courseId;
    
    if (Object.keys(updatedRecord).length === 0) {
      return res.status(400).json({ error: "No update provided" });
    }

    const quiz = await quizModel.findById(req.body.id);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Gérer le changement de cours
    if (req.body.courseId && quiz.course && quiz.course.toString() !== req.body.courseId) {
      await Course.findByIdAndUpdate(quiz.course, {
        $unset: { quiz: "" }
      });
    }

    const updatedQuiz = await quizModel.findByIdAndUpdate(
      req.body.id,
      { $set: updatedRecord },
      { new: true }
    ).populate('course');

    if (req.body.courseId) {
      await Course.findByIdAndUpdate(req.body.courseId, {
        quiz: req.body.id
      });
    }

    res.status(200).json(updatedQuiz);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Affecter un quiz à un cours
module.exports.assignQuizToCourse = async (req, res) => {
  try {
    const { quizId, courseId } = req.params;

    const quiz = await quizModel.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (quiz.course && quiz.course.toString() !== courseId) {
      await Course.findByIdAndUpdate(quiz.course, {
        $unset: { quiz: "" }
      });
    }

    quiz.course = courseId;
    await quiz.save();

    course.quiz = quizId;
    await course.save();

    res.status(200).json({ message: "Quiz assigned successfully" });
  } catch (err) {
    console.error("Assign error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Désaffecter un quiz d'un cours
module.exports.unassignQuizFromCourse = async (req, res) => {
  try {
    const { quizId, courseId } = req.params;

    const quiz = await quizModel.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    quiz.course = undefined;
    await quiz.save();

    course.quiz = undefined;
    await course.save();

    res.status(200).json({ message: "Quiz unassigned successfully" });
  } catch (err) {
    console.error("Unassign error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Les autres méthodes existantes restent inchangées
module.exports.findQuizByID=async(req,res)=>{
  User= await UserModel.findOne()
  if(User==null){
    return res.send('authorization failed')
  }
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send("ID unknown : " + req.params.id);
    quizModel.findById(req.params.id,(err, docs) => {
      if (!err) res.send(docs);
      else console.log("Error to get data : " + err);
    })
    

}

module.exports.addQuestion = async (req, res) => {
  const { id } = req.params;

  // Vérifiez que l'ID est valide
  if (!ObjectID.isValid(id)) {
      return res.status(400).send("ID unknown : " + id);
  }

  try {
      const quiz = await quizModel.findByIdAndUpdate(
          id,
          {
              $push: {
                  Questions: {
                      texte: req.body.texte,
                      code: req.body.code,
                      language: req.body.language,
                      QuestionType: req.body.QuestionType,
                      Responses: req.body.Responses,
                  },
              },
          },
          { new: true }
      );
      if (!quiz) {
          return res.status(404).send("Quiz not found");
      }
      res.send(quiz);
  } catch (err) {
      return res.status(500).send("Error updating quiz: " + err.message);
  }
};

module.exports.addScore = async (req, res) => {
  User= await UserModel.findOne()
  if(User==null){
    return res.send('authorization failed')
  }
  if (!ObjectID.isValid(req.body.idQuiz))
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
  
  if (!ObjectID.isValid(req.body.idQuiz))
    return res.status(400).send("ID unknown : " + req.body.idQuiz);
   qui= await quizModel.findOne({_id:req.body.idQuiz})
   question=qui.Questions.find(e=>e._id==req.body.idQuestion);
   reponse=question.Responses.find(e=>e._id==req.body.idResponse)
   reponse.idUsers.push(req.body.idUser)
   qui.save();
   return res.send(qui);
   
  
};

module.exports.DeleteQuestion = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
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
  User= await UserModel.findOne()
  if(User==null){
    return res.send('authorization failed')
  }
  if (!ObjectID.isValid(req.params.studentid))
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
  User= await UserModel.findOne()
  if(User==null){
    return res.send('authorization failed')
  }
  if (!ObjectID.isValid(req.body.idquiz))
    return res.status(400).send("ID unknown : " + req.body.idquiz);
   qui= await quizModel.findOne({_id:req.body.idquiz})
   resultat=qui.Results.find(e=>e.idUser==req.body.userId);
   resultat.Behavior=req.body.behavior;
   
   qui.save();
   return res.send(qui);
   
  
};

module.exports.toggleQuizActivation = async (req, res) => {
  User = await UserModel.findOne();
  if (User == null) {
    return res.send('authorization failed');
  }
  if (!ObjectID.isValid(req.params.id)) {
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
  User = await UserModel.findOne();
  if (User == null) {
    return res.send('authorization failed');
  }
  if (!ObjectID.isValid(req.params.idQuiz) || !ObjectID.isValid(req.params.idQuestion)) {
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
