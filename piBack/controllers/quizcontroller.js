const quizModel = require('../Model/Quiz');
const mongoose = require("mongoose");
const ObjectID = mongoose.Types.ObjectId;
const UserModel=require('../Model/User')
const { spawn } = require('child_process');
const {PythonShell} =require('python-shell');
//const pd = require("node-pandas")

module.exports.createQuiz = async (req, res) => {

    /*if (!ObjectID.isValid(req.params.idModule))
    return res.status(400).send("ID unknown : " + req.params.idModule);*/
  if(req.body.chrono&&req.body.chronoVal)
 {

  const newquiz = new quizModel({
    title: req.body.title,
    chrono: req.body.chrono,
    chronoVal: req.body.chronoVal,
    refModule: 1,
    dateQuiz: new Date().toDateString()
    
  });
  
  const quiz = await newquiz.save();
  return res.status(200).send("Quiz added "+quiz);
  }else{
    const newquiz = new quizModel({
      title: req.body.title,
      refModule: 1, //req.params.idModule,
      dateQuiz: new Date().toDateString()
    });
    
  const quiz = await newquiz.save();
  return res.status(200).send("Quiz added "+quiz);
  }
}

module.exports.find = async (req, res) => {
  try {
      // Utilisation de await pour récupérer tous les quiz
      const docs = await quizModel.find({});
      
      // Envoi des résultats si tout se passe bien
      res.send(docs);
  } catch (err) {
      // Gestion des erreurs
      console.log("Error to get data: " + err);
      res.status(500).send("Error to get data");
  }
};
module.exports.delete = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send("ID unknown : " + req.params.id);

  try {
    const quiz = await quizModel.findByIdAndDelete(req.params.id);

    if (!quiz) {
      return res.status(404).send("Quiz not found");
    }

    return res.status(200).send("Quiz deleted");
  } catch (err) {
    console.error("Delete error:", err);
    return res.status(500).send("Error deleting quiz");
  }
};

  
  module.exports.update = async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.body.id)) {
        return res.status(400).send("ID unknown : " + req.body.id);
      }
  
      const updatedRecord = {};
      if (req.body.title != null) updatedRecord["title"] = req.body.title;
      if (req.body.chrono != null) updatedRecord["chrono"] = req.body.chrono;
      if (req.body.chronoVal != null) updatedRecord["chronoVal"] = req.body.chronoVal;
  
      if (Object.keys(updatedRecord).length === 0) {
        return res.status(400).send("No update provided");
      }
  
      const updatedQuiz = await quizModel.findByIdAndUpdate(
        req.body.id,
        { $set: updatedRecord },
        { new: true }
      );
  
      if (!updatedQuiz) {
        return res.status(404).send("Quiz not found");
      }

      res.status(200).json(updatedQuiz);
    } catch (err) {
      console.error("Update error:", err);
      res.status(500).send("Server error");
    }
  };
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
/*idquiz:props[1]._id,
userId:Student._id,
behavior:r*/

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
