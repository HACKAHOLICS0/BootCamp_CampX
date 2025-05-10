/**
 * Script to update a quiz to be a final quiz
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: '../config/.env' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGO_URI || 'Not set');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Update quiz to be a final quiz
const updateQuiz = async (quizId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      console.error('Invalid quiz ID');
      return;
    }

    console.log('Updating quiz with ID:', quizId);
    
    // Update the quiz directly using the MongoDB driver
    const result = await mongoose.connection.db.collection('quizzes').updateOne(
      { _id: new mongoose.Types.ObjectId(quizId) },
      { $set: { isFinalQuiz: true } }
    );

    console.log('Update result:', result);
    
    if (result.matchedCount === 0) {
      console.error('Quiz not found');
    } else if (result.modifiedCount === 0) {
      console.log('Quiz was already marked as final');
    } else {
      console.log('Quiz updated successfully');
    }
  } catch (error) {
    console.error('Error updating quiz:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Main function
const main = async () => {
  // Get quiz ID from command line arguments
  const quizId = process.argv[2];

  if (!quizId) {
    console.error('Please provide a quiz ID as a command line argument');
    process.exit(1);
  }

  await connectDB();
  await updateQuiz(quizId);
};

// Run the main function
main().catch(console.error);
