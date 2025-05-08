/**
 * Script to manually generate a certificate for a user who has completed a quiz
 * Usage: node generateCertificateManually.js <userId> <quizId> <score> <percentage>
 */

// Import required modules
const mongoose = require('mongoose');
const certificateController = require('../controllers/certificateController');
require('dotenv').config();

// Connect to MongoDB
const MONGO_URI = 'mongodb://localhost:27017/HACKAHOLICS';
console.log('Connecting to MongoDB with URI:', MONGO_URI);

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000 // Increase timeout to 30 seconds
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Function to generate a certificate manually
async function generateCertificateManually(userId, quizId, score, percentage) {
  try {
    console.log('Generating certificate manually with the following parameters:');
    console.log('- userId:', userId);
    console.log('- quizId:', quizId);
    console.log('- score:', score);
    console.log('- percentage:', percentage);

    // Generate the certificate
    const certificate = await certificateController.generateCertificate(
      userId,
      quizId,
      parseInt(score),
      parseInt(percentage)
    );

    if (certificate) {
      console.log('Certificate generated successfully:');
      console.log('- certificateId:', certificate._id);
      console.log('- certificateNumber:', certificate.certificateNumber);
      console.log('- PDF URL:', `/api/certificates/${certificate._id}/pdf`);
    } else {
      console.error('Failed to generate certificate');
    }
  } catch (error) {
    console.error('Error generating certificate:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Get parameters from command line arguments
const userId = process.argv[2];
const quizId = process.argv[3];
const score = process.argv[4] || 2;
const percentage = process.argv[5] || 100;

if (!userId || !quizId) {
  console.error('Please provide userId and quizId as command line arguments');
  console.log('Usage: node generateCertificateManually.js <userId> <quizId> [score] [percentage]');
  process.exit(1);
}

// Run the function
generateCertificateManually(userId, quizId, score, percentage);
