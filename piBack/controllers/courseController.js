const Course = require('../Model/Course');
const User = require('../Model/User');
const Module = require('../Model/Module');
const Video = require('../Model/Video');
const Quiz = require('../Model/Quiz');
const mongoose = require('mongoose');

// Get all courses
const getAllCourses = async (req, res) => {
    try {
        // Récupérer tous les cours
        let courses = await Course.find();

        // Enrichir les données des cours avec les informations des modules
        const enrichedCourses = await Promise.all(courses.map(async (course) => {
            const courseObj = course.toObject();

            // Tenter de récupérer le module par moduleId ou module
            const moduleId = courseObj.moduleId || courseObj.module;
            if (moduleId) {
                try {
                    const moduleData = await Module.findById(moduleId);
                    if (moduleData) {
                        courseObj.module = moduleData;
                    }
                } catch (err) {
                    console.error(`Erreur lors de la récupération du module pour le cours ${courseObj._id}:`, err);
                }
            }

            return courseObj;
        }));

        console.log(`Retour de ${enrichedCourses.length} cours enrichis`);
        res.json(enrichedCourses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: error.message });
    }
};

// Add a course
const createCourse = async (req, res) => {
    try {
        const course = new Course(req.body);
        await course.save();
        res.status(201).json(course);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Edit a course
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

// Archive a course
const archiveCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { isArchived: true, updatedAt: Date.now() },
            { new: true }
        );
        if (!course) return res.status(404).json({ error: 'Course not found' });
        res.json(course);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get courses by module
const getCoursesByModule = async (req, res) => {
    try {
        console.log(`Recherche de cours pour le module avec ID: ${req.params.moduleId}`);

        // Récupérer d'abord tous les cours (pour débogage)
        const allCourses = await Course.find();
        console.log(`Nombre total de cours dans la base de données: ${allCourses.length}`);
        console.log('Liste des IDs de modules utilisés par les cours:');
        allCourses.forEach(course => {
            console.log(`Cours ${course._id} - module: ${course.module}, moduleId: ${course.moduleId}`);
            console.log(`Type de module: ${typeof course.module}, Est ObjectId: ${course.module instanceof mongoose.Types.ObjectId}`);
        });

        // Tenter une recherche directe avec l'ID exact (comme chaîne)
        let courses = await Course.find({
            module: req.params.moduleId,
            isArchived: false
        });

        // Si aucun résultat, essayer avec l'ID converti en ObjectId
        if (courses.length === 0) {
            console.log("Tentative avec conversion en ObjectId...");
            try {
                const objectIdModuleId = new mongoose.Types.ObjectId(req.params.moduleId);
                courses = await Course.find({
                    module: objectIdModuleId,
                    isArchived: false
                });
                console.log(`Après conversion en ObjectId: ${courses.length} cours trouvés`);
            } catch (err) {
                console.error("Erreur lors de la conversion en ObjectId:", err);
            }
        }

        console.log(`Nombre de cours trouvés pour le module ${req.params.moduleId}: ${courses.length}`);

        if (courses.length > 0) {
            // Enrichir les données des cours avec les informations des modules
            const enrichedCourses = await Promise.all(courses.map(async (course) => {
                const courseObj = course.toObject();

                // Tenter de récupérer le module
                try {
                    const moduleData = await Module.findById(req.params.moduleId);
                    if (moduleData) {
                        courseObj.module = moduleData;
                    }
                } catch (err) {
                    console.error(`Erreur lors de la récupération du module pour le cours ${courseObj._id}:`, err);
                }

                return courseObj;
            }));

            console.log(`Retour de ${enrichedCourses.length} cours pour le module ${req.params.moduleId}`);
            res.json(enrichedCourses);
        } else {
            console.log(`Aucun cours trouvé pour le module ${req.params.moduleId}`);
            res.json([]);
        }
    } catch (error) {
        console.error('Error fetching courses by module:', error);
        res.status(500).json({ error: error.message });
    }
};

// Purchase a course
const purchaseCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ error: 'Course not found' });

        if (course.purchasedBy.includes(req.user._id)) {
            return res.status(400).json({ error: 'Course already purchased' });
        }

        course.purchasedBy.push(req.user._id);
        await course.save();

        res.json({ message: 'Course purchased successfully', course });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get details of a specific course with videos and quizzes
const getCourseDetails = async (req, res) => {
    try {
        const courseId = req.params.id;

        // Récupérer le cours avec ses vidéos et quiz associés
        const course = await Course.findById(courseId)
            .populate('module')
            .lean();

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Récupérer les vidéos associées au cours
        const videos = await Video.find({ courseId }).lean();

        // Récupérer les quiz associés au cours
        const quizzes = await Quiz.find({ courseId }).select('-Questions.correctAnswer').lean();

        // Combiner toutes les données
        const courseDetails = {
            ...course,
            videos: videos || [],
            quizzes: quizzes || []
        };

        res.json(courseDetails);
    } catch (error) {
        console.error('Error fetching course details:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get course details with videos and quiz
const getCourseDetailsWithVideosAndQuiz = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate({
                path: 'quiz',
                select: 'title description chronoVal questions',
                populate: {
                    path: 'questions',
                    select: 'question options points activer'
                }
            });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Format quiz data for frontend
        if (course.quiz && course.quiz.questions) {
            const formattedQuiz = {
                _id: course.quiz._id,
                title: course.quiz.title,
                description: course.quiz.description,
                chronoVal: course.quiz.chronoVal,
                questions: course.quiz.questions.map(q => ({
                    _id: q._id,
                    question: q.question,
                    options: q.options.map(opt => ({
                        text: opt.text,
                        _id: opt._id
                    })),
                    points: q.points,
                    activer: q.activer
                }))
            };
            course.quiz = formattedQuiz;
        }

        res.json(course);
    } catch (error) {
        console.error('Error in getCourseDetails:', error);
        res.status(500).json({ error: error.message });
    }
};

// Save quiz response
const saveQuizResponse = async (req, res) => {
    const { userId, courseId, question, answer, videoProgress } = req.body;
    try {
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const userProgress = course.userProgress.find(up => up.userId.toString() === userId);
        if (!userProgress) {
            course.userProgress.push({
                userId,
                videoProgress,
                quizResponses: [{ question, answer }]
            });
        } else {
            userProgress.videoProgress = videoProgress;
            userProgress.quizResponses.push({ question, answer });
        }

        await course.save();
        res.status(200).json({ message: 'Quiz response saved' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get courses by category
const getCoursesByCategory = async (req, res) => {
    try {
        const { category } = req.params;

        // Validate category
        const validCategories = [
            'javascript', 'typescript', 'python', 'java', 'csharp',
            'sql', 'mongodb', 'html', 'css', 'php', 'ruby', 'go',
            'rust', 'swift', 'kotlin', 'scala', 'r', 'shell',
            'powershell', 'bash', 'docker', 'yaml', 'json', 'xml',
            'markdown', 'other'
        ];

        if (!validCategories.includes(category)) {
            return res.status(400).json({ error: 'Invalid category' });
        }

        const courses = await Course.find({
            category,
            isArchived: false
        }).populate('module');

        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses by category:', error);
        res.status(500).json({ error: error.message });
    }
};

// Add code example to course
const addCodeExample = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, description, code, language, isExercise, solution, hints } = req.body;

        // Validate required fields
        if (!title || !description || !code || !language) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Create new code example
        const codeExample = {
            title,
            description,
            code,
            language,
            isExercise: isExercise || false,
            solution: solution || '',
            hints: hints || []
        };

        // Add to course
        if (!course.codeExamples) {
            course.codeExamples = [];
        }

        course.codeExamples.push(codeExample);
        course.updatedAt = Date.now();

        await course.save();

        res.status(201).json({
            message: 'Code example added successfully',
            codeExample: course.codeExamples[course.codeExamples.length - 1]
        });
    } catch (error) {
        console.error('Error adding code example:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update code example
const updateCodeExample = async (req, res) => {
    try {
        const { courseId, exampleId } = req.params;
        const { title, description, code, language, isExercise, solution, hints } = req.body;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Find the code example
        const codeExampleIndex = course.codeExamples.findIndex(
            example => example._id.toString() === exampleId
        );

        if (codeExampleIndex === -1) {
            return res.status(404).json({ error: 'Code example not found' });
        }

        // Update the code example
        if (title) course.codeExamples[codeExampleIndex].title = title;
        if (description) course.codeExamples[codeExampleIndex].description = description;
        if (code) course.codeExamples[codeExampleIndex].code = code;
        if (language) course.codeExamples[codeExampleIndex].language = language;
        if (isExercise !== undefined) course.codeExamples[codeExampleIndex].isExercise = isExercise;
        if (solution !== undefined) course.codeExamples[codeExampleIndex].solution = solution;
        if (hints) course.codeExamples[codeExampleIndex].hints = hints;

        course.updatedAt = Date.now();
        await course.save();

        res.json({
            message: 'Code example updated successfully',
            codeExample: course.codeExamples[codeExampleIndex]
        });
    } catch (error) {
        console.error('Error updating code example:', error);
        res.status(500).json({ error: error.message });
    }
};

// Delete code example
const deleteCodeExample = async (req, res) => {
    try {
        const { courseId, exampleId } = req.params;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Find and remove the code example
        const initialLength = course.codeExamples.length;
        course.codeExamples = course.codeExamples.filter(
            example => example._id.toString() !== exampleId
        );

        if (course.codeExamples.length === initialLength) {
            return res.status(404).json({ error: 'Code example not found' });
        }

        course.updatedAt = Date.now();
        await course.save();

        res.json({ message: 'Code example deleted successfully' });
    } catch (error) {
        console.error('Error deleting code example:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllCourses,
    createCourse,
    updateCourse,
    archiveCourse,
    getCoursesByModule,
    getCoursesByCategory,
    purchaseCourse,
    getCourseDetails,
    saveQuizResponse,
    addCodeExample,
    updateCodeExample,
    deleteCodeExample
};