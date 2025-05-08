const jwt = require('jsonwebtoken');
const User = require('../Model/User');

// Middleware pour vérifier si l'utilisateur est authentifié
exports.authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.token || 
                      (req.headers.authorization && req.headers.authorization.split(' ')[1]);

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: "Accès non autorisé. Veuillez vous connecter." 
            });
        }

        console.log("Token trouvé :", token); // Log pour vérifier le token reçu

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log("Décodé :", decoded); // Log pour vérifier les informations du token

        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "Utilisateur non trouvé." 
            });
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error('Erreur d\'authentification:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: "Token invalide. Veuillez vous reconnecter." 
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: "Session expirée. Veuillez vous reconnecter." 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: "Erreur d'authentification. Veuillez réessayer." 
        });
    }
};

// Middleware pour vérifier si l'utilisateur est un administrateur
exports.adminMiddleware = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: "Accès non autorisé. Veuillez vous connecter." 
            });
        }
        
        // Vérifier si l'utilisateur est admin en utilisant typeUser
        if (req.user.typeUser !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: "Accès réservé aux administrateurs." 
            });
        }
        
        next();
    } catch (error) {
        console.error('Erreur de vérification d\'admin:', error);
        res.status(500).json({ 
            success: false, 
            message: "Erreur de vérification des droits d'administration." 
        });
    }
};
