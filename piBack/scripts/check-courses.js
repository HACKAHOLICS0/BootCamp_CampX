require('dotenv').config({ path: './config/.env' });
const mongoose = require('mongoose');
const Course = require('../Model/Course');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      const courses = await Course.find({ 
        category: { $in: ['javascript', 'python', 'sql', 'mongodb', 'html', 'css'] } 
      });
      
      console.log('Cours avec éditeur de code:', courses.length);
      
      courses.forEach(c => {
        console.log(`- ${c.title} (${c.category}): ${c.codeExamples ? c.codeExamples.length : 0} exemples`);
      });
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(err => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
  });
