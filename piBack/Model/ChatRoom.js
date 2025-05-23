const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ''
  }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  },
  time: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const chatRoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  participants: {
    type: [participantSchema],
    default: []
  },
  messages: {
    type: [messageSchema],
    default: []
  },
  type: {
    type: String,
    default: 'group'
  },
  createdBy: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Méthode pour ajouter un participant
chatRoomSchema.methods.addParticipant = function(userId, username, avatar = '') {
  if (!this.participants.some(p => p.userId === userId)) {
    this.participants.push({ userId, username, avatar });
  }
};

// Méthode pour ajouter un message
chatRoomSchema.methods.addMessage = function(userId, username, message, avatar = '') {
  this.messages.push({
    userId,
    username,
    message,
    avatar,
    time: new Date()
  });
};

// Index pour améliorer les performances des requêtes
chatRoomSchema.index({ name: 1 }, { unique: true });
chatRoomSchema.index({ 'participants.userId': 1 });
chatRoomSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema); 