var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Quiz = new Schema({
  
  refModule: {
    type: String
  },
  dateQuiz: {
    type: Date
  },
  title: {
    type: String
  },
  chrono: {
    type: Boolean,
    default:false
  },
  chronoVal:{
      type:Number
  },
  activer: {
    type: Boolean,
    default: true // Par défaut, un quiz est activé
  },
 
  Questions: {
    type: [
        {
          texte: String,
          code:String,
          language:String,
          QuestionType:String,

          Responses: {
              type:
            [{
                texte:String,
                correct:Boolean,
                idUsers:[String],


              }]
          },
          activer: {
            type: Boolean,
            default: true // Par défaut, une question est activée
          }
        }
      ],
  },
  Results:{
    type:[
        {
          idUser:String,
          Note:Number,
          totalClicksofmap:Number,
          Behavior:String,
          time:{
            type:{
              h:Number,
              m:Number,
              s:Number,
              
            },
          }
        }
    ]
}
  
  
 



  


});

module.exports = mongoose.model('Quiz', Quiz);