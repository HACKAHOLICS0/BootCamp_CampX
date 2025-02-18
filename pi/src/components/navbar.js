import React from "react"; 
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import '../Navbar.css'; // Importons un fichier CSS pour personnaliser davantage le design
import { useUser } from "../JS/UserProvider";

export default function Navbar() {
  const { user, logout } = useUser();


  return (
    <div id="header" className="bg-white text-dark py-3 shadow-lg">
      <div className="container d-flex align-items-center justify-content-between">
        <h1 className="logo me-auto text-light">
          <Link to="/" className="text-light text-decoration-none">
            <span className="logo-text">HACKAHOLICS</span>
          </Link>
        </h1>
        <nav id="navbar" className="navbar navbar-expand-lg">
          <ul className="navbar-nav d-flex flex-row">
            <li className="nav-item">
              <Link to="/" className="nav-link text-dark hover-effect">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/modules" className="nav-link text-dark hover-effect">
                Modules
              </Link>
            </li>
            {!user ? (
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
            ) : (
              <>
                <li className="nav-item">
                  <Link to="/profile" className="nav-link text-dark hover-effect">
                    Profile
                  </Link>
                </li>
                <li className="nav-item">
                  <button onClick={logout} className="nav-link text-dark hover-effect">
                    Logout
                  </button>
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