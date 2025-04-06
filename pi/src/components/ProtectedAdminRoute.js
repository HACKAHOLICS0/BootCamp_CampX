import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Cookies from 'js-cookie';

const ProtectedAdminRoute = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = () => {
      const userCookie = Cookies.get('user');
      console.log('User cookie found:', !!userCookie);
      
      if (!userCookie) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }
      
      try {
        const user = JSON.parse(userCookie);
        console.log('User data:', user);
        console.log('User type:', user.typeUser || 'not found');
        
        // Vérifier le bon champ pour le rôle admin (typeUser)
        if (user && user.typeUser === 'admin') {
          console.log('Admin access granted');
          setIsAdmin(true);
        } else {
          console.log('Not an admin user');
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error parsing user cookie:', error);
        setIsAdmin(false);
      }
      
      setIsLoading(false);
    };

    checkAdminStatus();
    
    // Ajouter un event listener pour détecter les changements d'utilisateur
    const handleUserUpdated = () => {
      console.log('User updated event detected');
      checkAdminStatus();
    };
    
    window.addEventListener('userUpdated', handleUserUpdated);
    
    return () => {
      window.removeEventListener('userUpdated', handleUserUpdated);
    };
  }, []);

  if (isLoading) {
    return <div>Vérification des autorisations...</div>;
  }

  return isAdmin ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedAdminRoute;
