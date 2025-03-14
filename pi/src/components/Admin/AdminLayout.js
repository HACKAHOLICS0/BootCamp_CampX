import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { 
  Home, User, Package, BarChart2, Bell, Settings, BookOpen, Search, 
  LogOut, Sun, Moon, Menu, Book, Layers, FolderTree, Video, Activity
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
          <li><Link to="/admin"><Home size={20} /> <span>Dashboard</span></Link></li>
          <li><Link to="/admin/users"><User size={20} /> <span>Users</span></Link></li>
          <li><Link to="/admin/points"><Package size={20} /> <span>Points Of Interest</span></Link></li>
          <li><Link to="/admin/quizs"><BookOpen size={20} /> <span>Quizs</span></Link></li>
          <li><Link to="/admin/categories"><FolderTree size={20} /> <span>Categories</span></Link></li>
          <li><Link to="/admin/modules"><Layers size={20} /> <span>Modules</span></Link></li>
          <li><Link to="/admin/courses"><Book size={20} /> <span>Courses</span></Link></li>
          <li><Link to="/admin/videoquiz-stats"><Video size={20} /> <span>Quiz Vidéos</span></Link></li>
          <li><Link to="/admin/analytics"><BarChart2 size={20} /> <span>Analytics</span></Link></li>
          <li><Link to="/admin/notifications"><Bell size={20} /> <span>Notifications</span></Link></li>
          <li><Link to="/admin/settings"><Settings size={20} /> <span>Settings</span></Link></li>
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
        <input type="text" placeholder="Search..." />
      </div>
      <div className="topbar-right">
        <button className="theme-toggle" onClick={toggleTheme}>
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div className="user-menu">
          <img
            src={user?.image || "https://via.placeholder.com/100"}
            alt="User"
          />
          <span>{user?.name || 'User'} {user?.lastName || ''}</span>
          <button className="logout-icon-btn" onClick={onLogout}>
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