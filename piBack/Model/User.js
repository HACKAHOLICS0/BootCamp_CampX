var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    googleId: {  // Google OAuth ID (useful for login and mapping)
        type: String,
        unique: true,  // Ensure it's unique to prevent duplicate accounts
        sparse: true,   // Allows for documents without this field (non-Google users)
    },
    name: {
        type: String,
        required: true,  // You can make it required depending on your logic
    },
    lastName: {
        type: String,
    },
    birthDate: {
        type: Date,
    },
    email: {
        type: String,
        required: true,
        unique: true,  // Ensure email is unique for non-Google users
    },
    phone: {
        type: Number,
    },
    password: {
        type: String,
        required: true,  // Required if you're using local authentication
    },
    image: {
        type: String,
    },
    token: {
        type: String,
    },
    state: {
        type: Number,
        default: 1,  // Default value, you can change this to match your app's state logic
    },
    githubId: {
        type: String,
        unique: true, // Un utilisateur GitHub doit être unique
        sparse: true, // Permet d'avoir des utilisateurs sans GitHub ID (Google, Email, etc.)
    },
    authProvider: {
        type: String,
        enum: ['auth', 'github', 'local'],
    },
    coursepreferences: {
        type: [String],
    },
    refinterestpoints: {
        type: [String],
    },
    refmodules: {
        type: [String],
    },
    reffriends: {
        type: [String],
    },
    typeUser: {
        type: String,
    },
    isVerified: { 
        type: Boolean, 
        default: false  // <-- Add this field
    },  
    emailVerificationToken: {
        type: String
    },
    verificationCode: {
        type: String
    },
    enrolledCourses: [
        {
            courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
            progress: { type: Number, default: 0 }, // En pourcentage
            timeSpent: { type: Number, default: 0 }, // Temps passé en minutes
            quizzesCompleted: { type: Number, default: 0 } 
        }
    ]
});

module.exports = mongoose.model('User', UserSchema); // Avec une majuscule