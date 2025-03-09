var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
    name: {
        type: String,
        required: [true, 'Le nom est requis']
    },
    lastName: {
        type: String,
        required: [true, 'Le nom de famille est requis']
    },
    birthDate: {
        type: Date,
        required: [true, 'La date de naissance est requise']
    },
    email: {
        type: String,
        required: [true, 'L\'email est requis'],
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Le numéro de téléphone est requis']
    },
    password: {
        type: String,
        required: [true, 'Le mot de passe est requis']
    },
    image: {
        type: String,
        default: null,
        get: function(v) {
            return v ? v.replace(/\\/g, '/') : null;
        }
    },
    state: {
        type: Number,
        default: 1
    },
    coursepreferences: {
        type: [String],
        default: []
    },
    refinterestpoints: {
        type: [String],
        default: []
    },
    refmodules: {
        type: [String],
        default: []
    },
    reffriends: {
        type: [String],
        default: []
    },   
    typeUser: {
        type: String,
        required: [true, 'Le type d\'utilisateur est requis'],
        enum: ['user', 'admin', 'instructor'],
        default: 'user'
    },
    isVerified: { 
        type: Boolean, 
        default: false  
    },
    emailVerificationToken: {
        type: String
    },
    verificationCode: {
        type: String
    },
    lastFaceVerification: {
        type: Date,
        default: null
    },
    faceVerificationAttempts: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

// Middleware pour formater l'image avant la sauvegarde
User.pre('save', function(next) {
    if (this.image) {
        this.image = this.image.replace(/\\/g, '/');
    }
    next();
});

module.exports = mongoose.model('user', User);