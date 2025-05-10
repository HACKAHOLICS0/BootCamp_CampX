import React from 'react';
import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const PrivateRoute = ({ children }) => {
    const token = Cookies.get('token');
    
    if (!token) {
        // Redirect to login if there's no token
        return <Navigate to="/signin" replace />;
    }

    // If there is a token, render the protected component
    return children;
};

export default PrivateRoute; 