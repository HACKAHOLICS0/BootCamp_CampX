const VideoQuiz = require('../Model/VideoQuiz');
const VideoQuizResponse = require('../Model/VideoQuizResponse');
const User = require('../Model/User');

// Créer un nouveau quiz vidéo
exports.createVideoQuiz = async (req, res) => {
    try {
        const { videoId, courseId, questions } = req.body;

        const videoQuiz = new VideoQuiz({
            videoId,
            courseId,
            questions
        });

        await videoQuiz.save();
        res.status(201).json(videoQuiz);
    } catch (error) {
        console.error('Error creating video quiz:', error);
        res.status(500).json({ error: error.message });
    }
};

// Obtenir les quiz pour une vidéo spécifique
exports.getVideoQuizzes = async (req, res) => {
    try {
        const { videoId } = req.params;
        const quizzes = await VideoQuiz.find({ videoId });
        res.json(quizzes);
    } catch (error) {
        console.error('Error fetching video quizzes:', error);
        res.status(500).json({ error: error.message });
    }
};

// Enregistrer une réponse de quiz vidéo
exports.saveQuizResponse = async (req, res) => {
    try {
        const { userId, videoId, courseId, questionId, selectedOption, isCorrect, videoProgress } = req.body;

        // Rechercher si l'utilisateur a déjà des réponses enregistrées pour cette vidéo
        let quizResponse = await VideoQuizResponse.findOne({ userId, videoId });
        
        if (quizResponse) {
            // Mettre à jour les réponses existantes
            const responseIndex = quizResponse.responses.findIndex(r => 
                r.questionId.toString() === questionId
            );
            
            if (responseIndex >= 0) {
                // Mettre à jour une réponse existante
                quizResponse.responses[responseIndex] = {
                    questionId,
                    selectedOption,
                    isCorrect,
                    timestamp: new Date()
                };
            } else {
                // Ajouter une nouvelle réponse
                quizResponse.responses.push({
                    questionId,
                    selectedOption,
                    isCorrect,
                    timestamp: new Date()
                });
            }

            // Mettre à jour la progression et le score
            quizResponse.videoProgress = Math.max(quizResponse.videoProgress, videoProgress);
            quizResponse.totalScore = quizResponse.responses.filter(r => r.isCorrect).length;
            quizResponse.updatedAt = new Date();

            await quizResponse.save();
        } else {
            // Créer un nouveau document de réponse
            quizResponse = new VideoQuizResponse({
                userId,
                videoId,
                courseId,
                responses: [{
                    questionId,
                    selectedOption,
                    isCorrect,
                    timestamp: new Date()
                }],
                videoProgress,
                totalScore: isCorrect ? 1 : 0
            });

            await quizResponse.save();
        }

        res.status(200).json(quizResponse);
    } catch (error) {
        console.error('Error saving quiz response:', error);
        res.status(500).json({ error: error.message });
    }
};

// Obtenir les réponses aux quiz pour un utilisateur
exports.getUserQuizResponses = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Vérifier que l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const responses = await VideoQuizResponse.find({ userId })
            .populate('videoId', 'title url')
            .populate('courseId', 'title');
        
        res.json(responses);
    } catch (error) {
        console.error('Error fetching user quiz responses:', error);
        res.status(500).json({ error: error.message });
    }
};

// Obtenir des statistiques globales pour le tableau de bord admin
exports.getQuizStatistics = async (req, res) => {
    try {
        // Nombre total de réponses
        const totalResponses = await VideoQuizResponse.countDocuments();
        
        // Nombre de réponses correctes et incorrectes
        const allResponses = await VideoQuizResponse.find();
        
        let correctResponses = 0;
        let totalQuestions = 0;
        
        allResponses.forEach(response => {
            totalQuestions += response.responses.length;
            correctResponses += response.responses.filter(r => r.isCorrect).length;
        });
        
        // Vidéos les plus engageantes (basées sur le nombre de réponses)
        const videoEngagement = await VideoQuizResponse.aggregate([
            { $group: { 
                _id: "$videoId", 
                responseCount: { $sum: 1 },
                averageProgress: { $avg: "$videoProgress" }
            }},
            { $sort: { responseCount: -1 } },
            { $limit: 5 }
        ]);
        
        // Utilisateurs les plus actifs
        const activeUsers = await VideoQuizResponse.aggregate([
            { $group: { 
                _id: "$userId", 
                responseCount: { $sum: 1 },
                averageScore: { $avg: "$totalScore" }
            }},
            { $sort: { responseCount: -1 } },
            { $limit: 5 }
        ]);
        
        res.json({
            totalResponses,
            correctResponses,
            totalQuestions,
            correctRate: totalQuestions > 0 ? (correctResponses / totalQuestions * 100).toFixed(2) + '%' : '0%',
            videoEngagement,
            activeUsers
        });
    } catch (error) {
        console.error('Error fetching quiz statistics:', error);
        res.status(500).json({ error: error.message });
    }
};

// Obtenir la progression d'un utilisateur dans ses cours vidéo
exports.getUserVideoProgress = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Vérifier que l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const progress = await VideoQuizResponse.find({ userId })
            .populate('courseId', 'title')
            .populate('videoId', 'title url duration');
        
        // Formater les données pour une visualisation facile
        const formattedProgress = progress.map(item => ({
            courseId: item.courseId._id,
            courseTitle: item.courseId.title,
            videoId: item.videoId._id,
            videoTitle: item.videoId.title,
            currentProgress: item.videoProgress,
            totalDuration: item.videoId.duration || 0,
            progressPercentage: item.videoId.duration 
                ? (item.videoProgress / item.videoId.duration * 100).toFixed(2) + '%' 
                : '0%',
            totalQuizAnswered: item.responses.length,
            correctAnswers: item.responses.filter(r => r.isCorrect).length,
            score: item.totalScore,
            lastUpdated: item.updatedAt
        }));
        
        res.json(formattedProgress);
    } catch (error) {
        console.error('Error fetching user video progress:', error);
        res.status(500).json({ error: error.message });
    }
};
