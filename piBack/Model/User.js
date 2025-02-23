var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
    name : {
        type:String
    },
    lastName : {
        type:String
    },
    birthDate : {
        type:Date
    },
    email : {
        type:String
    },
    phone : {
        type:Number
    },
    password : {
        type:String
    },
    image : {
        type:String
    },
    token : {
        type:String
    },
    state : {
        type:Number
    },
    githubId: {
        type: String,
        unique: true, // Un utilisateur GitHub doit être unique
        sparse: true, // Permet d'avoir des utilisateurs sans GitHub ID (Google, Email, etc.)
      },
    coursepreferences : {
        type:[String]
    },
    refinterestpoints : {
        type:[String]
    },
    refmodules : {
        type:[String]
    },
    reffriends : {
        type:[String]
    },   
    typeUser : {
        type:String,
    } 
    
});

module.exports = mongoose.model('User', User); // Avec une majuscule
