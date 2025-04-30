import React, { useState, useEffect } from 'react';
import { Users, Book, FolderTree, Layers } from 'lucide-react';
import './styles/AdminPointsStyle.css';
import axios from 'axios';

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
  const [stats, setStats] = useState({
    users: 0,
    categories: 0,
    modules: 0,
    courses: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Assurez-vous que l'URL de base est correcte
        const baseURL = 'http://localhost:5000'; // ou votre URL de backend

        const [
          usersResponse,
          categoriesResponse,
          modulesResponse,
          coursesResponse
        ] = await Promise.all([
          axios.get(`${baseURL}/api/admin/users/count`),
          axios.get(`${baseURL}/api/admin/categories/count`),
          axios.get(`${baseURL}/api/admin/modules/count`),
          axios.get(`${baseURL}/api/admin/courses/count`)
        ]);

        // Afficher les réponses complètes pour déboguer la structure
        console.log('Réponses brutes:', {
          users: usersResponse.data,
          categories: categoriesResponse.data,
          modules: modulesResponse.data,
          courses: coursesResponse.data
        });

        // Vérifier la structure exacte de chaque réponse
        console.log('Structure users:', JSON.stringify(usersResponse.data));
        console.log('Structure categories:', JSON.stringify(categoriesResponse.data));
        console.log('Structure modules:', JSON.stringify(modulesResponse.data));
        console.log('Structure courses:', JSON.stringify(coursesResponse.data));

        // Extraire les valeurs en vérifiant différentes structures possibles
        const getUserCount = () => {
          if (typeof usersResponse.data === 'object' && usersResponse.data !== null) {
            return usersResponse.data.count !== undefined ? usersResponse.data.count :
                  (usersResponse.data.total !== undefined ? usersResponse.data.total : 0);
          }
          return typeof usersResponse.data === 'number' ? usersResponse.data : 0;
        };

        const getCategoryCount = () => {
          if (typeof categoriesResponse.data === 'object' && categoriesResponse.data !== null) {
            return categoriesResponse.data.count !== undefined ? categoriesResponse.data.count :
                  (categoriesResponse.data.total !== undefined ? categoriesResponse.data.total : 0);
          }
          return typeof categoriesResponse.data === 'number' ? categoriesResponse.data : 0;
        };

        const getModuleCount = () => {
          if (typeof modulesResponse.data === 'object' && modulesResponse.data !== null) {
            return modulesResponse.data.count !== undefined ? modulesResponse.data.count :
                  (modulesResponse.data.total !== undefined ? modulesResponse.data.total : 0);
          }
          return typeof modulesResponse.data === 'number' ? modulesResponse.data : 0;
        };

        const getCourseCount = () => {
          if (typeof coursesResponse.data === 'object' && coursesResponse.data !== null) {
            return coursesResponse.data.count !== undefined ? coursesResponse.data.count :
                  (coursesResponse.data.total !== undefined ? coursesResponse.data.total : 0);
          }
          return typeof coursesResponse.data === 'number' ? coursesResponse.data : 0;
        };

        const newStats = {
          users: getUserCount(),
          categories: getCategoryCount(),
          modules: getModuleCount(),
          courses: getCourseCount()
        };

        console.log('Valeurs extraites:', newStats);
        setStats(newStats);
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        // Afficher l'erreur spécifique
        if (error.response) {
          console.error('Réponse d\'erreur:', error.response.data);
        }

        // Définir des valeurs par défaut en cas d'erreur
        setStats({
          users: 0,
          categories: 0,
          modules: 0,
          courses: 0
        });

        // Afficher un message d'erreur à l'utilisateur
        // Vous pouvez utiliser une bibliothèque de notification comme react-toastify
        // toast.error('Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div>Chargement...</div>;
  }

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
