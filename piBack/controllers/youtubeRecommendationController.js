const User = require('../Model/User');
const InterestPoint = require('../Model/Interestpoint');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config({ path: './config/.env' });

/**
 * Contrôleur pour les recommandations de vidéos YouTube basées sur les points d'intérêt de l'utilisateur
 */

// Liste de vidéos YouTube par catégorie (pour éviter d'utiliser une API payante)
const youtubeVideosByCategory = {
    'PYTHON': [
        {
            title: 'Python pour les débutants - Cours complet',
            videoId: 'rfscVS0vtbw',
            thumbnail: 'https://i.ytimg.com/vi/rfscVS0vtbw/hqdefault.jpg',
            channel: 'freeCodeCamp.org',
            duration: '4h 27min'
        },
        {
            title: 'Apprendre Python - Tutoriel complet pour débutant',
            videoId: 'HWxBtxPBCAc',
            thumbnail: 'https://i.ytimg.com/vi/HWxBtxPBCAc/hqdefault.jpg',
            channel: 'Graven - Développement',
            duration: '2h 15min'
        },
        {
            title: 'Python Crash Course - Apprendre Python en 1 heure',
            videoId: 'kqtD5dpn9C8',
            thumbnail: 'https://i.ytimg.com/vi/kqtD5dpn9C8/hqdefault.jpg',
            channel: 'Programming with Mosh',
            duration: '1h 00min'
        }
    ],
    'REACT': [
        {
            title: 'React JS Crash Course 2023',
            videoId: 'w7ejDZ8SWv8',
            thumbnail: 'https://i.ytimg.com/vi/w7ejDZ8SWv8/hqdefault.jpg',
            channel: 'Traversy Media',
            duration: '1h 48min'
        },
        {
            title: 'React pour les débutants - Tutoriel complet',
            videoId: 'bMknfKXIFA8',
            thumbnail: 'https://i.ytimg.com/vi/bMknfKXIFA8/hqdefault.jpg',
            channel: 'freeCodeCamp.org',
            duration: '11h 55min'
        },
        {
            title: 'Apprendre React en 2023 - Tutoriel pour débutants',
            videoId: 'f55qeKGgB_M',
            thumbnail: 'https://i.ytimg.com/vi/f55qeKGgB_M/hqdefault.jpg',
            channel: 'Fireship',
            duration: '30min'
        }
    ],
    'BIG DATA': [
        {
            title: 'Introduction au Big Data et Hadoop',
            videoId: 'zez2Tv-bcXY',
            thumbnail: 'https://i.ytimg.com/vi/zez2Tv-bcXY/hqdefault.jpg',
            channel: 'Edureka',
            duration: '1h 15min'
        },
        {
            title: 'Big Data Analytics - Tutoriel complet',
            videoId: 'U4-X8A9HCHM',
            thumbnail: 'https://i.ytimg.com/vi/U4-X8A9HCHM/hqdefault.jpg',
            channel: 'Intellipaat',
            duration: '8h 32min'
        },
        {
            title: 'Apache Spark - Tutoriel pour débutants',
            videoId: 'zC9cnh8rJd0',
            thumbnail: 'https://i.ytimg.com/vi/zC9cnh8rJd0/hqdefault.jpg',
            channel: 'Simplilearn',
            duration: '2h 12min'
        }
    ],
    'ANGULAR': [
        {
            title: 'Angular Crash Course 2023',
            videoId: '3dHNOWTI7H8',
            thumbnail: 'https://i.ytimg.com/vi/3dHNOWTI7H8/hqdefault.jpg',
            channel: 'Traversy Media',
            duration: '1h 30min'
        },
        {
            title: 'Angular pour les débutants - Tutoriel complet',
            videoId: '3qBXWUpoPHo',
            thumbnail: 'https://i.ytimg.com/vi/3qBXWUpoPHo/hqdefault.jpg',
            channel: 'freeCodeCamp.org',
            duration: '10h 32min'
        },
        {
            title: 'Apprendre Angular en 1 heure',
            videoId: 'k5E2AVpwsko',
            thumbnail: 'https://i.ytimg.com/vi/k5E2AVpwsko/hqdefault.jpg',
            channel: 'Programming with Mosh',
            duration: '1h 00min'
        }
    ],
    'NODE': [
        {
            title: 'Node.js Crash Course',
            videoId: 'fBNz5xF-Kx4',
            thumbnail: 'https://i.ytimg.com/vi/fBNz5xF-Kx4/hqdefault.jpg',
            channel: 'Traversy Media',
            duration: '1h 30min'
        },
        {
            title: 'Node.js et Express.js - Tutoriel complet',
            videoId: 'Oe421EPjeBE',
            thumbnail: 'https://i.ytimg.com/vi/Oe421EPjeBE/hqdefault.jpg',
            channel: 'freeCodeCamp.org',
            duration: '8h 16min'
        },
        {
            title: 'Node.js pour débutants - Tutoriel complet',
            videoId: 'TlB_eWDSMt4',
            thumbnail: 'https://i.ytimg.com/vi/TlB_eWDSMt4/hqdefault.jpg',
            channel: 'Programming with Mosh',
            duration: '1h 18min'
        }
    ],
    'JAVASCRIPT': [
        {
            title: 'JavaScript Crash Course pour débutants',
            videoId: 'hdI2bqOjy3c',
            thumbnail: 'https://i.ytimg.com/vi/hdI2bqOjy3c/hqdefault.jpg',
            channel: 'Traversy Media',
            duration: '1h 40min'
        },
        {
            title: 'Apprendre JavaScript - Tutoriel complet pour débutants',
            videoId: 'PkZNo7MFNFg',
            thumbnail: 'https://i.ytimg.com/vi/PkZNo7MFNFg/hqdefault.jpg',
            channel: 'freeCodeCamp.org',
            duration: '3h 26min'
        },
        {
            title: 'JavaScript pour débutants - Cours complet',
            videoId: 'W6NZfCO5SIk',
            thumbnail: 'https://i.ytimg.com/vi/W6NZfCO5SIk/hqdefault.jpg',
            channel: 'Programming with Mosh',
            duration: '1h 48min'
        }
    ],
    'PHP': [
        {
            title: 'PHP pour les débutants - Tutoriel complet',
            videoId: 'BUCiSSyIGGU',
            thumbnail: 'https://i.ytimg.com/vi/BUCiSSyIGGU/hqdefault.jpg',
            channel: 'Traversy Media',
            duration: '1h 05min'
        },
        {
            title: 'Apprendre PHP - Tutoriel complet',
            videoId: 'OK_JCtrrv-c',
            thumbnail: 'https://i.ytimg.com/vi/OK_JCtrrv-c/hqdefault.jpg',
            channel: 'freeCodeCamp.org',
            duration: '4h 36min'
        },
        {
            title: 'PHP & MySQL - Tutoriel pour débutants',
            videoId: 'yXzWfZ4N4xU',
            thumbnail: 'https://i.ytimg.com/vi/yXzWfZ4N4xU/hqdefault.jpg',
            channel: 'The Net Ninja',
            duration: '5h 00min'
        }
    ]
};

// Vidéos par défaut si aucun point d'intérêt n'est trouvé
const defaultVideos = [
    {
        title: 'Introduction à la programmation - Cours complet',
        videoId: 'zOjov-2OZ0E',
        thumbnail: 'https://i.ytimg.com/vi/zOjov-2OZ0E/hqdefault.jpg',
        channel: 'freeCodeCamp.org',
        duration: '2h 30min'
    },
    {
        title: 'HTML & CSS - Tutoriel complet pour débutants',
        videoId: 'G3e-cpL7ofc',
        thumbnail: 'https://i.ytimg.com/vi/G3e-cpL7ofc/hqdefault.jpg',
        channel: 'SuperSimpleDev',
        duration: '6h 15min'
    },
    {
        title: 'Git et GitHub pour débutants',
        videoId: 'RGOj5yH7evk',
        thumbnail: 'https://i.ytimg.com/vi/RGOj5yH7evk/hqdefault.jpg',
        channel: 'freeCodeCamp.org',
        duration: '1h 09min'
    }
];

/**
 * Recherche des vidéos YouTube via l'API YouTube
 * @param {string} query - Terme de recherche
 * @param {number} maxResults - Nombre maximum de résultats (défaut: 10)
 * @returns {Promise<Array>} - Liste des vidéos trouvées
 */
async function searchYouTubeVideos(query, maxResults = 10) {
    try {
        // Vérifier si la clé API YouTube est définie
        const apiKey = process.env.YOUTUBE_API_KEY;

        if (!apiKey) {
            console.error('Clé API YouTube non définie. Utilisez des données statiques.');
            // Retourner des données statiques si pas de clé API
            const staticCategory = query.toUpperCase();
            return youtubeVideosByCategory[staticCategory] || defaultVideos;
        }

        console.log(`Recherche YouTube pour: "${query}" (max: ${maxResults})`);

        // Construire l'URL de l'API YouTube
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=${maxResults}&type=video&key=${apiKey}`;

        // Faire la requête à l'API YouTube
        const response = await axios.get(url);

        if (!response.data || !response.data.items) {
            console.error('Réponse YouTube invalide:', response.data);
            throw new Error('Réponse YouTube invalide');
        }

        // Extraire les IDs des vidéos pour obtenir plus de détails
        const videoIds = response.data.items.map(item => item.id.videoId).join(',');

        // Obtenir les détails des vidéos (durée, etc.)
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${videoIds}&key=${apiKey}`;
        const detailsResponse = await axios.get(detailsUrl);

        if (!detailsResponse.data || !detailsResponse.data.items) {
            console.error('Réponse YouTube détails invalide:', detailsResponse.data);
            throw new Error('Réponse YouTube détails invalide');
        }

        // Formater les résultats
        const videos = detailsResponse.data.items.map(item => {
            // Convertir la durée ISO 8601 en format lisible
            const duration = item.contentDetails.duration
                .replace('PT', '')
                .replace('H', 'h ')
                .replace('M', 'min ')
                .replace('S', 's');

            return {
                title: item.snippet.title,
                videoId: item.id,
                thumbnail: item.snippet.thumbnails.high.url,
                channel: item.snippet.channelTitle,
                duration: duration,
                viewCount: item.statistics.viewCount,
                publishedAt: item.snippet.publishedAt
            };
        });

        console.log(`${videos.length} vidéos YouTube trouvées pour "${query}"`);
        return videos;
    } catch (error) {
        console.error('Erreur lors de la recherche YouTube:', error.message);

        // En cas d'erreur, retourner des données statiques
        const staticCategory = query.toUpperCase();
        return youtubeVideosByCategory[staticCategory] || defaultVideos;
    }
}

/**
 * Récupère les vidéos YouTube recommandées basées sur les points d'intérêt de l'utilisateur
 */
exports.getYoutubeRecommendations = async (req, res) => {
    try {
        // Récupérer l'ID de l'utilisateur connecté
        const userId = req.user._id;

        // Récupérer l'utilisateur avec ses points d'intérêt
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Récupérer les points d'intérêt de l'utilisateur
        const userInterestPoints = user.refinterestpoints || [];

        // Si l'utilisateur n'a pas de points d'intérêt, retourner des vidéos par défaut
        if (userInterestPoints.length === 0) {
            return res.json({
                success: true,
                message: 'Aucun point d\'intérêt trouvé, affichage des vidéos par défaut',
                videos: defaultVideos.map(video => ({
                    ...video,
                    videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
                    platform: 'YouTube'
                }))
            });
        }

        // Récupérer les détails des points d'intérêt
        const interestPoints = await InterestPoint.find({
            // Vérifier si les points d'intérêt sont des ObjectId ou des chaînes de caractères
            $or: [
                { _id: { $in: userInterestPoints.filter(id => mongoose.Types.ObjectId.isValid(id)) } },
                { value: { $in: userInterestPoints.filter(id => !mongoose.Types.ObjectId.isValid(id)) } }
            ]
        });

        // Extraire les valeurs des points d'intérêt
        const interestValues = interestPoints.map(point => point.value);

        console.log('Points d\'intérêt de l\'utilisateur:', interestValues);

        // Limiter le nombre de vidéos si nécessaire
        const limit = req.query.limit ? parseInt(req.query.limit) : 6;

        // Récupérer les vidéos pour chaque point d'intérêt via l'API YouTube
        let allVideos = [];

        // Calculer combien de vidéos par point d'intérêt
        const videosPerInterest = Math.ceil(limit / interestValues.length);

        // Récupérer les vidéos pour chaque point d'intérêt
        for (const interest of interestValues) {
            try {
                const videos = await searchYouTubeVideos(interest, videosPerInterest);
                allVideos = [...allVideos, ...videos];
                console.log(`Ajout de ${videos.length} vidéos pour le point d'intérêt: ${interest}`);
            } catch (error) {
                console.error(`Erreur lors de la recherche pour ${interest}:`, error.message);
            }
        }

        // Si aucune vidéo n'est trouvée, retourner des vidéos par défaut
        if (allVideos.length === 0) {
            allVideos = defaultVideos;
        }

        // Limiter le nombre total de vidéos
        allVideos = allVideos.slice(0, limit);

        // Formater les vidéos pour l'affichage
        const formattedVideos = allVideos.map(video => ({
            ...video,
            videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
            platform: 'YouTube'
        }));

        res.json({
            success: true,
            count: formattedVideos.length,
            videos: formattedVideos,
            interestPoints: interestValues
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des recommandations YouTube:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des recommandations',
            error: error.message
        });
    }
};

/**
 * Récupère les vidéos YouTube pour une catégorie spécifique
 */
exports.getYoutubeVideosByCategory = async (req, res) => {
    try {
        const { category } = req.params;

        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Catégorie non spécifiée'
            });
        }

        console.log(`Recherche de vidéos pour la catégorie: ${category}`);

        // Limiter le nombre de vidéos si nécessaire
        const limit = req.query.limit ? parseInt(req.query.limit) : 6;

        // Rechercher des vidéos via l'API YouTube
        let videos = await searchYouTubeVideos(category, limit);

        // Formater les vidéos pour l'affichage
        const formattedVideos = videos.map(video => ({
            ...video,
            videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
            platform: 'YouTube'
        }));

        res.json({
            success: true,
            count: formattedVideos.length,
            videos: formattedVideos,
            category: category
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des vidéos YouTube par catégorie:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des vidéos',
            error: error.message
        });
    }
};
