import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Cookies from 'js-cookie';

const ProtectedAdminRoute = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = () => {
      // Vérifier d'abord dans localStorage
      const userLocalStorage = localStorage.getItem('user');
      console.log('User localStorage found:', !!userLocalStorage);

      // Si pas dans localStorage, vérifier dans les cookies (pour la compatibilité)
      const userCookie = Cookies.get('user');
      console.log('User cookie found:', !!userCookie);

      // Utiliser localStorage en priorité, puis cookie comme fallback
      const userData = userLocalStorage || userCookie;

      if (!userData) {
        console.log('No user data found in localStorage or cookies');
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const user = JSON.parse(userData);
        console.log('User data:', user);
        console.log('User type:', user.typeUser || 'not found');

        // Vérifier le bon champ pour le rôle admin (typeUser)
        if (user && user.typeUser === 'admin') {
          console.log('Admin access granted');
          setIsAdmin(true);
        } else {
          console.log('Not an admin user. User type:', user.typeUser);
          // Afficher tous les champs de l'utilisateur pour le débogage
          console.log('All user fields:', Object.keys(user));
          console.log('User object:', user);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
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

  console.log("Final admin status:", isAdmin);

  if (!isAdmin) {
    console.log("Access denied to admin route. Redirecting to home page.");
    return <Navigate to="/" />;
  }

  console.log("Access granted to admin route.");
  return <Outlet />;
};

export default ProtectedAdminRoute;
