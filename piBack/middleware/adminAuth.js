const adminAuth = (req, res, next) => {
    try {
        // Check if user exists and is an admin
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }
        next();
    } catch (err) {
        res.status(500).json({ message: 'Error in admin authorization' });
    }
};

module.exports = adminAuth;
