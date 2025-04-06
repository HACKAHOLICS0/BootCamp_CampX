import React, { createContext, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate(); // Use the useNavigate hook

    const login = (userData) => {
        setUser(userData);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token'); // Remove token from localStorage
        navigate('/signin'); // Redirect to the sign-in page
    };

    return (
        <UserContext.Provider value={{ user, login, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);