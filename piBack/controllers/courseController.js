const Course = require('../Model/Course');
const User = require('../Model/User');
const Module = require('../Model/Module');
const Quiz = require('../Model/Quiz'); 
const mongoose = require('mongoose'); 

// Get all courses
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ archived: { $ne: true } })
      .populate('module', 'title')
      .populate({
        path: 'quizzes',
        select: 'title description chronoVal Questions',
        populate: {
          path: 'Questions',
          match: { activer: true },
          select: 'texte activer'
        }
      });

    // Format courses for frontend
    const formattedCourses = courses.map(course => ({
      ...course.toObject(),
      quizCount: course.quizzes?.length || 0
    }));

    res.status(200).json(formattedCourses);
  } catch (err) {
    console.error("Get all courses error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get courses by module
const getCoursesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(400).json({ error: "Invalid module ID" });
    }

    const courses = await Course.find({ 
      module: moduleId,
      archived: { $ne: true }
    })
    .populate({
      path: 'quizzes',
      select: 'title description chronoVal Questions',
      populate: {
        path: 'Questions',
        match: { activer: true },
        select: 'texte activer'
      }
    });

    // Format courses for frontend
    const formattedCourses = courses.map(course => ({
      ...course.toObject(),
      quizCount: course.quizzes?.length || 0
    }));

    res.status(200).json(formattedCourses);
  } catch (err) {
    console.error("Get courses by module error:", err);
    res.status(500).json({ error: err.message });
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

// Get course by ID
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate({
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

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Format quiz data for frontend
    const formattedCourse = {
      ...course.toObject(),
      quizzes: course.quizzes.map(quiz => ({
        ...quiz,
        questionCount: quiz.Questions?.length || 0
      }))
    };

    res.status(200).json(formattedCourse);
  } catch (err) {
    console.error("Get course error:", err);
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

module.exports = {
    getAllCourses,
    getCoursesByModule,
    getCourseById,
    createCourse,
    updateCourse,
    purchaseCourse,
    addQuizToCourse,
    removeQuizFromCourse,
    archiveCourse
};
