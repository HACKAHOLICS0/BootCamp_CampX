/**
 * Script to fix quizzes in the database
 * This script will:
 * 1. Update all quizzes to ensure they have the isFinalQuiz field
 * 2. Print a list of all quizzes with their isFinalQuiz status
 */

// Import required modules
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: './config/.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define Quiz model
const quizSchema = new mongoose.Schema({
  title: String,
  description: String,
  chrono: Boolean,
  chronoVal: Number,
  course: mongoose.Schema.Types.ObjectId,
  isFinalQuiz: Boolean,
  Questions: Array
});

const Quiz = mongoose.model('Quiz', quizSchema, 'quizzes');

// Function to fix quizzes
async function fixQuizzes() {
  try {
    // Get all quizzes
    const quizzes = await Quiz.find();
    console.log(`Found ${quizzes.length} quizzes`);

    // Create a log file
    const logFile = path.join(__dirname, 'quizzes_log.txt');
    let logContent = 'Quiz ID,Title,isFinalQuiz\n';

    // Update each quiz
    for (const quiz of quizzes) {
      // Log quiz details
      logContent += `${quiz._id},${quiz.title},${quiz.isFinalQuiz}\n`;
      
      // Ensure isFinalQuiz is a boolean
      if (quiz.isFinalQuiz === undefined) {
        quiz.isFinalQuiz = false;
        await quiz.save();
        console.log(`Updated quiz ${quiz._id} (${quiz.title}) - Set isFinalQuiz to false`);
      }
    }

    // Write log to file
    fs.writeFileSync(logFile, logContent);
    console.log(`Log file created: ${logFile}`);

    // Find quizzes with specific ID
    if (process.argv[2]) {
      const quizId = process.argv[2];
      const specificQuiz = await Quiz.findById(quizId);
      
      if (specificQuiz) {
        console.log('\nSpecific quiz details:');
        console.log('- ID:', specificQuiz._id);
        console.log('- Title:', specificQuiz.title);
        console.log('- isFinalQuiz:', specificQuiz.isFinalQuiz);
        
        // Update the quiz if requested
        if (process.argv[3] === 'update') {
          specificQuiz.isFinalQuiz = true;
          await specificQuiz.save();
          console.log('- Updated isFinalQuiz to true');
        }
      } else {
        console.log(`\nQuiz with ID ${quizId} not found`);
      }
    }
  } catch (error) {
    console.error('Error fixing quizzes:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
fixQuizzes();
