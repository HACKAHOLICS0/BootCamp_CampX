import React from 'react';
import { Users, Book, FolderTree, Layers } from 'lucide-react';
import './styles/AdminPointsStyle.css';

const DashboardCard = ({ title, value, icon: Icon, color }) => (
  <div className="dashboard-card" style={{ borderColor: color }}>
    <div className="card-icon" style={{ backgroundColor: color }}>
      <Icon size={24} color="white" />
    </div>
    <div className="card-content">
      <h3>{title}</h3>
      <p className="value">{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  // Ces valeurs seront remplacées par des données réelles de l'API
  const stats = {
    users: 150,
    categories: 12,
    modules: 25,
    courses: 48
  };

  return (
    <div className="content-section">
      <h2>Dashboard</h2>
      
      <div className="dashboard-grid">
        <DashboardCard
          title="Utilisateurs"
          value={stats.users}
          icon={Users}
          color="#4CAF50"
        />
        <DashboardCard
          title="Catégories"
          value={stats.categories}
          icon={FolderTree}
          color="#2196F3"
        />
        <DashboardCard
          title="Modules"
          value={stats.modules}
          icon={Layers}
          color="#FF9800"
        />
        <DashboardCard
          title="Cours"
          value={stats.courses}
          icon={Book}
          color="#E91E63"
        />
      </div>

      <div className="dashboard-charts">
        {/* Espace réservé pour les graphiques futurs */}
      </div>
    </div>
  );
};

export default Dashboard;
