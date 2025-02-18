var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
    name: {
        type: String
    },
    lastName: {
        type: String
    },
    birthDate: {
        type: Date
    },
    email: {
        type: String
    },
    phone: {
        type: String
    },
    password: {
        type: String
    },
    image: {
        type: String
    },
    token: {
        type: String
    },
    googleId: {
        type: String
      },
      
    state: {
        type: Number
    },
    coursepreferences: {
        type: [String]
    },
    refinterestpoints: {
        type: [String]
    },
    refmodules: {
        type: [String]
    },
    reffriends: {
        type: [String]
    },
    typeUser: {
        type: String,
    },
    verificationCode: {  // New field for verification code
        type: String,
        required: false  // You can set this to true if you want the field to be mandatory
    }
});

module.exports = mongoose.model('user', User);
