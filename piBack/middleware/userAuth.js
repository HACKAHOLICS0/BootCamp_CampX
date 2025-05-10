const jwt = require('jsonwebtoken');
const User = require('../Model/User');

const userAuth = async (req, res, next) => {
    try {
        console.log('Authentication middleware called');
        console.log('Headers:', req.headers);
        console.log('Cookies:', req.cookies);

        // Get token from header or cookies
        const token = req.header('Authorization')?.replace('Bearer ', '') ||
                     (req.cookies && req.cookies.token) ||
                     (req.body && req.body.token) ||
                     (req.query && req.query.token);

        console.log('Token found:', token ? 'Yes' : 'No');

        if (!token) {
            console.log('No authentication token provided');
            return res.status(401).json({
                message: 'No authentication token, access denied',
                code: 'NO_TOKEN'
            });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (tokenError) {
            console.error('Token verification error:', tokenError);

            if (tokenError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    message: 'Your session has expired. Please sign in again.',
                    code: 'TOKEN_EXPIRED'
                });
            }

            return res.status(401).json({
                message: 'Invalid authentication token',
                code: 'INVALID_TOKEN'
            });
        }

        // Find user
        console.log('Looking for user with ID:', decoded.id);
        const user = await User.findById(decoded.id);

        if (!user) {
            console.error('User not found with ID:', decoded.id);
            return res.status(404).json({
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        console.log('User found:', user.name, user.email);

        // Add user to request
        req.user = user;
        console.log('Authentication successful');
        next();
    } catch (err) {
        console.error('Authentication error:', err);
        res.status(500).json({
            message: 'Authentication error',
            code: 'AUTH_ERROR'
        });
    }
};

module.exports = userAuth;
