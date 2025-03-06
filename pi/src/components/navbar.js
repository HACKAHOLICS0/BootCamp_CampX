import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../Navbar.css";
import Cookies from "js-cookie";
import axios from 'axios';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  // Fonction pour mettre à jour l'utilisateur
  const updateUser = () => {
    const storedUser = Cookies.get("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  };

  useEffect(() => {
    updateUser();
    
    const handleUserUpdate = () => updateUser();
    window.addEventListener("userUpdated", handleUserUpdate);

    const fetchCategories = async () => {
      try {
        const token = Cookies.get('token');
        const response = await axios.get('http://localhost:5001/api/categories', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.data) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories([]); // En cas d'erreur, on met un tableau vide
      }
    };

    fetchCategories();

    return () => {
      window.removeEventListener("userUpdated", handleUserUpdate);
    };
  }, []);

  // Fonction pour déconnecter l'utilisateur
  const handleSignOut = (e) => {
    e.preventDefault();
    Cookies.remove("user");
    Cookies.remove("token");
    setUser(null);
    window.dispatchEvent(new Event("userUpdated"));
    navigate("/signin");
  };

  const handleCategoryClick = (categoryId) => {
    navigate(`/categories/${categoryId}/modules`);
  };

  return (
    <div id="header" className="bg-white text-dark py-3 shadow-lg">
      <div className="container d-flex align-items-center justify-content-between">
        <h1 className="logo me-auto text-light">
          <Link to="/" className="text-light text-decoration-none">
            <span className="logo-text">CAMP X</span>
          </Link>
        </h1>
        <nav id="navbar" className="navbar navbar-expand-lg">
          <ul className="navbar-nav d-flex flex-row">
            <li className="nav-item">
              <Link to="/" className="nav-link text-dark hover-effect">
                Home
              </Link>
            </li>
            {user && ( // N'afficher le dropdown que si l'utilisateur est connecté
              <li className="nav-item dropdown">
                <span 
                  className="nav-link text-dark hover-effect dropdown-toggle"
                >
                  Categories
                </span>
                <ul className="dropdown-menu">
                  {categories.map(category => (
                    <li key={category._id}>
                      <button 
                        className="dropdown-item"
                        onClick={() => handleCategoryClick(category._id)}
                      >
                        {category.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            )}
            {user ? (
              <li className="nav-item d-flex">
                {user.role === 'admin' && (
                  <Link to="/admin" className="nav-link text-dark hover-effect">
                    Admin Dashboard
                  </Link>
                )}
                <Link to="/profile" className="nav-link text-dark hover-effect">
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="nav-link btn btn-link text-dark hover-effect"
                >
                  Sign Out
                </button>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <Link to="/signin" className="nav-link text-dark hover-effect">
                    Sign In
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/signup" className="nav-link text-dark hover-effect">
                    Sign Up
                  </Link>
                </li>
              </>
            )}
          </ul>
          <i className="bi bi-list mobile-nav-toggle text-dark d-block d-lg-none"></i>
        </nav>
      </div>
    </div>
  );
}
