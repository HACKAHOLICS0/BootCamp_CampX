/**
 * Script to check if a quiz is marked as final in the database
 */
const mongoose = require('mongoose');
const Quiz = require('../Model/Quiz');
require('dotenv').config({ path: './config/.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Function to check if a quiz is marked as final
async function checkQuizFinalStatus(quizId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      console.error('Invalid quiz ID');
      return;
    }

    const quiz = await Quiz.findById(quizId);
    
    if (!quiz) {
      console.error('Quiz not found');
      return;
    }

    console.log('Quiz details:');
    console.log('- ID:', quiz._id);
    console.log('- Title:', quiz.title);
    console.log('- Is Final Quiz:', quiz.isFinalQuiz);
    console.log('- Course:', quiz.course);
    
    // Update the quiz to be a final quiz if it's not already
    if (!quiz.isFinalQuiz) {
      console.log('Updating quiz to be a final quiz...');
      quiz.isFinalQuiz = true;
      await quiz.save();
      console.log('Quiz updated successfully');
    } else {
      console.log('Quiz is already marked as final');
    }
  } catch (error) {
    console.error('Error checking quiz status:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Get quiz ID from command line arguments
const quizId = process.argv[2];

if (!quizId) {
  console.error('Please provide a quiz ID as a command line argument');
  process.exit(1);
}

checkQuizFinalStatus(quizId);
