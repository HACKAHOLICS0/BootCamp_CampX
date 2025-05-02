const jwt = require('jsonwebtoken');
const User = require('../Model/User');

const adminAuth = async (req, res, next) => {
    try {
        // Get token from header
        let token = null;

        // Check Authorization header
        const authHeader = req.header('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.replace('Bearer ', '');
            console.log('Token found in Authorization header');
        }

        // If no token in header, check cookies
        if (!token && req.cookies && req.cookies.token) {
            token = req.cookies.token;
            console.log('Token found in cookies');
        }

        console.log('Token exists:', !!token);

        if (!token) {
            return res.status(401).json({ message: 'No authentication token, access denied' });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token decoded successfully');
            console.log('Decoded token:', decoded);
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
        let user;
        try {
            user = await User.findById(decoded.id);
            console.log('User found:', !!user);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
        } catch (userError) {
            console.error('Error finding user:', userError);
            return res.status(500).json({ message: 'Error finding user' });
        }

        // Check if user is admin (from token or from user object)
        if (decoded.typeUser !== 'admin' && user.typeUser !== 'admin') {
            console.log('User role in token:', decoded.typeUser);
            console.log('User role in database:', user.typeUser);
            return res.status(403).json({ message: 'Access denied, admin only' });
        }

        // Add user to request
        req.user = user;
        next();
    } catch (err) {
        console.error('Admin authentication error:', err);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = adminAuth;
