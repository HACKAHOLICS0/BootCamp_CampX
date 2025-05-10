import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import {
  Home, User, Package, BarChart2, Bell, Settings, BookOpen, Search,
  LogOut, Sun, Moon, Menu, Book, Layers, FolderTree, Video, Calendar,CheckSquare
} from 'lucide-react';
import Cookies from 'js-cookie';
import './AdminStyle.css';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button className="toggle-btn" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li><Link to="/admin"><Home size={20} /> <span>Tableau de bord</span></Link></li>
          <li><Link to="/admin/users"><User size={20} /> <span>Utilisateurs</span></Link></li>
          <li><Link to="/admin/points"><Package size={20} /> <span>Points d'intérêt</span></Link></li>
          <li><Link to="/admin/quizs"><BookOpen size={20} /> <span>Quiz</span></Link></li>
          <li><Link to="/admin/categories"><FolderTree size={20} /> <span>Catégories</span></Link></li>
          <li><Link to="/admin/modules"><Layers size={20} /> <span>Modules</span></Link></li>
          <li><Link to="/admin/courses"><Book size={20} /> <span>Cours</span></Link></li>
          <li><Link to="/admin/videos"><Video size={20} /> <span>Vidéos</span></Link></li>
          <li><Link to="/admin/analytics"><BarChart2 size={20} /> <span>Analytiques</span></Link></li>
          <li><Link to="/admin/events"><Calendar size={20} /> <span>Événements</span></Link></li>
          <li><Link to="/admin/pending-events"><CheckSquare size={20} /> <span>Événements en attente</span></Link></li>

          <li><Link to="/admin/notifications"><Bell size={20} /> <span>Notifications</span></Link></li>
          <li><Link to="/admin/settings"><Settings size={20} /> <span>Paramètres</span></Link></li>
        </ul>
      </nav>
    </div>
  );
};

const TopBar = ({ toggleTheme, isDarkMode, onLogout }) => {
  const user = JSON.parse(Cookies.get("user") || '{}');

  return (
    <div className="topbar">
      <div className="search-box">
        <Search size={20} />
        <input type="text" placeholder="Rechercher..." />
      </div>
      <div className="topbar-right">
        <button className="theme-toggle" onClick={toggleTheme} title={isDarkMode ? "Mode clair" : "Mode sombre"}>
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div className="user-menu">
          <span className="user-name">{user?.name || 'User'} {user?.lastName || ''}</span>
          <button className="logout-icon-btn" onClick={onLogout} title="Déconnexion">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!Cookies.get("user")) {
      navigate("/signin");
    }
  }, [navigate]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-mode');
  };

  const handleLogout = () => {
    Cookies.remove("user");
    navigate("/signin");
  };

  return (
    <div className={`admin-layout ${isDarkMode ? 'dark-mode' : ''}`}>
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      <div className="main-content">
        <TopBar toggleTheme={toggleTheme} isDarkMode={isDarkMode} onLogout={handleLogout} />
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;