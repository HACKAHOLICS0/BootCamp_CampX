const Course = require('../Model/Course');
const User = require('../Model/User');
const Module = require('../Model/Module');
const Quiz = require('../Model/Quiz'); 
const mongoose = require('mongoose'); 

// Get all courses
const getAllCourses = async (req, res) => {
  try {
    console.log("Début de getAllCourses");
    
    // D'abord récupérer les cours sans populate
    const courses = await Course.find({ archived: { $ne: true } });
    console.log("Cours trouvés:", courses.length);

    // Populate module avec gestion d'erreur
    const populatedCourses = await Course.populate(courses, {
      path: 'module',
      select: 'title'
    });
    console.log("Populate module terminé");

    // Populate quizzes avec gestion d'erreur
    const fullyPopulatedCourses = await Course.populate(populatedCourses, {
      path: 'quizzes',
      select: 'title description chronoVal Questions',
      populate: {
        path: 'Questions',
        match: { activer: true },
        select: 'texte activer'
      }
    });
    console.log("Populate quizzes terminé");

    // Format courses for frontend avec vérification des valeurs
    const formattedCourses = fullyPopulatedCourses.map(course => {
      const courseObj = course.toObject();
      return {
        ...courseObj,
        module: courseObj.module || { title: 'Module non trouvé' },
        quizCount: courseObj.quizzes ? courseObj.quizzes.length : 0
      };
    });
    console.log("Formatage terminé");

    res.status(200).json(formattedCourses);
  } catch (err) {
    console.error("Get all courses error détaillé:", err);
    console.error("Stack trace:", err.stack);
    res.status(500).json({ 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Get courses by module
const getCoursesByModule = async (req, res) => {
  try {
    console.log("Début de getCoursesByModule");
    const { moduleId } = req.params;
    console.log("moduleId reçu:", moduleId);

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      console.log("ID de module invalide");
      return res.status(400).json({ error: "Invalid module ID" });
    }

    // Vérifier si le module existe
    const moduleExists = await Module.findById(moduleId);
    if (!moduleExists) {
      console.log("Module non trouvé");
      return res.status(404).json({ error: "Module not found" });
    }

    // Récupérer les cours sans populate d'abord
    const courses = await Course.find({ 
      module: moduleId,
      archived: { $ne: true }
    });
    console.log("Cours trouvés:", courses.length);

    // Populate module
    const coursesWithModule = await Course.populate(courses, {
      path: 'module',
      select: 'title description'
    });
    console.log("Populate module terminé");

    // Populate quizzes et questions
    const fullyPopulatedCourses = await Course.populate(coursesWithModule, {
      path: 'quizzes',
      select: 'title description chronoVal Questions',
      populate: {
        path: 'Questions',
        match: { activer: true },
        select: 'texte activer'
      }
    });
    console.log("Populate quizzes terminé");

    // Format courses for frontend avec vérification des valeurs
    const formattedCourses = fullyPopulatedCourses.map(course => {
      const courseObj = course.toObject();
      return {
        ...courseObj,
        module: courseObj.module || { title: 'Module non trouvé' },
        quizCount: courseObj.quizzes ? courseObj.quizzes.length : 0,
        title: courseObj.title || 'Sans titre',
        description: courseObj.description || 'Pas de description'
      };
    });
    console.log("Formatage terminé");

    res.status(200).json(formattedCourses);
  } catch (err) {
    console.error("Get courses by module error détaillé:", err);
    console.error("Stack trace:", err.stack);
    res.status(500).json({ 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Get course by ID
const getCourseById = async (req, res) => {
  try {
    console.log("Début de getCourseById");
    console.log("ID du cours recherché:", req.params.id);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log("ID de cours invalide");
      return res.status(400).json({ error: "Invalid course ID" });
    }

    // D'abord récupérer le cours sans populate
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      console.log("Cours non trouvé");
      return res.status(404).json({ error: "Course not found" });
    }
    console.log("Cours trouvé");

    // Populate module
    await course.populate('module', 'title description');
    console.log("Module populé");

    // Populate quizzes séparément
    await course.populate({
      path: 'quizzes',
      select: 'title description chronoVal Questions',
      populate: {
        path: 'Questions',
        match: { activer: true },
        select: 'texte points Responses',
        populate: {
          path: 'Responses',
          select: 'texte'
        }
      }
    });
    console.log("Quizzes populés");

    // Format course data for frontend avec vérification des valeurs
    const formattedCourse = {
      ...course.toObject(),
      module: course.module || { title: 'Module non trouvé' },
      quizzes: (course.quizzes || []).map(quiz => ({
        ...quiz,
        questionCount: quiz.Questions?.length || 0,
        title: quiz.title || 'Quiz sans titre',
        description: quiz.description || 'Pas de description'
      })),
      title: course.title || 'Cours sans titre',
      description: course.description || 'Pas de description',
      content: course.content || 'Pas de contenu',
      price: course.price || 0,
      duration: course.duration || 0
    };
    console.log("Formatage terminé");

    res.status(200).json(formattedCourse);
  } catch (err) {
    console.error("Get course error détaillé:", err);
    console.error("Stack trace:", err.stack);
    res.status(500).json({ 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Create course
const createCourse = async (req, res) => {
  try {
    const course = new Course(req.body);
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update course
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Purchase course
const purchaseCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid course or user ID" });
    }

    const user = await User.findById(userId);
    const course = await Course.findById(courseId);

    if (!user || !course) {
      return res.status(404).json({ error: "User or course not found" });
    }

    if (!user.purchasedCourses.includes(courseId)) {
      user.purchasedCourses.push(courseId);
      await user.save();
    }

    res.status(200).json({ message: "Course purchased successfully" });
  } catch (err) {
    console.error("Purchase course error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Add quiz to course
const addQuizToCourse = async (req, res) => {
  try {
    const { courseId, quizId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ error: "Invalid course or quiz ID" });
    }

    const course = await Course.findById(courseId);
    const quiz = await Quiz.findById(quizId);

    if (!course || !quiz) {
      return res.status(404).json({ error: "Course or quiz not found" });
    }

    if (!course.quizzes.includes(quizId)) {
      course.quizzes.push(quizId);
      await course.save();
    }

    quiz.course = courseId;
    await quiz.save();

    res.status(200).json(course);
  } catch (err) {
    console.error("Add quiz to course error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Remove quiz from course
const removeQuizFromCourse = async (req, res) => {
  try {
    const { courseId, quizId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ error: "Invalid course or quiz ID" });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    course.quizzes = course.quizzes.filter(q => q.toString() !== quizId);
    await course.save();

    // Also update the quiz to remove the course reference
    await Quiz.findByIdAndUpdate(quizId, { $unset: { course: 1 } });

    res.status(200).json(course);
  } catch (err) {
    console.error("Remove quiz from course error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Archive course
const archiveCourse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid course ID" });
    }

    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    course.archived = !course.archived;
    await course.save();

    res.status(200).json({ message: `Course ${course.archived ? 'archived' : 'unarchived'} successfully` });
  } catch (err) {
    console.error("Archive course error:", err);
    res.status(500).json({ error: err.message });
  }
};
// Get purchased courses for the authenticated user
const getPurchasedCourses = async (req, res) => {
  try {
    console.log('Fetching purchased courses for user:', req.user.id);
    const userId = req.user.id;

    // Find the user first
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ error: "User not found" });
    }

    // Get all enrolled course IDs
    const enrolledCourseIds = user.enrolledCourses.map(course => course.courseId);

    // Fetch the courses with populated fields, including category through module
    const courses = await Course.find({
      _id: { $in: enrolledCourseIds }
    }).populate({
      path: 'module',
      select: 'title category',
      populate: {
        path: 'category',
        select: 'name'
      }
    });

    // Map the courses with enrollment data
    const purchasedCourses = courses.map(course => {
      const enrollment = user.enrolledCourses.find(
        e => e.courseId.toString() === course._id.toString()
      );

      return {
        _id: course._id,
        title: course.title || 'Untitled Course',
        description: course.description || 'No description available',
        price: course.price || 0,
        duration: course.duration || 0,
        category: course.module?.category || null,
        module: {
          _id: course.module?._id || null,
          title: course.module?.title || 'Unknown Module'
        },
        progress: enrollment?.progress || 0,
        timeSpent: enrollment?.timeSpent || 0,
        quizzesCompleted: enrollment?.quizzesCompleted || 0,
        totalQuizzes: course.quizzes?.length || 0,
        totalVideos: course.videos?.length || 0
      };
    });

    console.log('Sending purchased courses:', purchasedCourses);
    res.json(purchasedCourses);
  } catch (error) {
    console.error('Error fetching purchased courses:', error);
    res.status(500).json({ 
      message: 'Error fetching purchased courses', 
      error: error.message 
    });
  }
};

module.exports = {
  getAllCourses,
  getCoursesByModule,
  getCourseById,
  createCourse,
  updateCourse,
  purchaseCourse,
  addQuizToCourse,
  removeQuizFromCourse,
  archiveCourse,
  getPurchasedCourses
};
