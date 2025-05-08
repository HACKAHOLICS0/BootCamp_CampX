import React, { useState, useEffect } from 'react';
import { Users, Book, FolderTree, Layers, Activity } from 'lucide-react';
import './styles/AdminPointsStyle.css';
import './styles/DashboardStyle.css';
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

  // État pour les activités récentes
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Assurez-vous que l'URL de base est correcte
        const baseURL = 'http://51.91.251.228:5000'; // ou votre URL de backend

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

        // Nous avons supprimé le code pour les données mensuelles qui ne sont plus utilisées

        // Récupérer les activités récentes
        try {
          const activitiesResponse = await axios.get(`${baseURL}/api/admin/activities/recent`);
          if (activitiesResponse.data && Array.isArray(activitiesResponse.data)) {
            setRecentActivities(activitiesResponse.data.slice(0, 5)); // Limiter à 5 activités
          }
        } catch (activityError) {
          console.error('Erreur lors de la récupération des activités récentes:', activityError);
          // Continuer sans les activités récentes
        }
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

  // Les options des graphiques ont été supprimées car les graphiques ne sont plus utilisés

  if (loading) {
    return <div className="loading-container">
      <div className="spinner"></div>
      <p>Chargement des données...</p>
    </div>;
  }

  return (
    <div className="content-section">
      <div className="dashboard-header">
        <h2>Tableau de Bord</h2>
        <p>Vue d'ensemble des statistiques de la plateforme</p>
      </div>

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

      {/* Les graphiques statistiques ont été supprimés */}

      <div className="recent-activity">
        <div className="activity-header">
          <h3>Activités Récentes</h3>
          <div className="chart-icon">
            <Activity size={20} color="#333" />
          </div>
        </div>
        <ul className="activity-list">
          {recentActivities && recentActivities.length > 0 ? (
            recentActivities.map((activity, index) => {
              // Déterminer l'icône et la couleur en fonction du type d'activité
              let icon = <Users size={20} color="#2196F3" />;
              let bgColor = '#e3f2fd';

              if (activity.type === 'course' || activity.type === 'cours') {
                icon = <Book size={20} color="#E91E63" />;
                bgColor = '#fce4ec';
              } else if (activity.type === 'module') {
                icon = <Layers size={20} color="#FF9800" />;
                bgColor = '#fff3e0';
              } else if (activity.type === 'category' || activity.type === 'catégorie') {
                icon = <FolderTree size={20} color="#2196F3" />;
                bgColor = '#e3f2fd';
              }

              // Formater la date
              const formatDate = (dateString) => {
                if (!dateString) return 'Date inconnue';

                const date = new Date(dateString);
                const now = new Date();
                const diffTime = Math.abs(now - date);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 0) {
                  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
                  if (diffHours === 0) {
                    const diffMinutes = Math.floor(diffTime / (1000 * 60));
                    return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
                  }
                  return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
                } else if (diffDays === 1) {
                  return 'Hier';
                } else if (diffDays < 7) {
                  return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
                } else {
                  return date.toLocaleDateString('fr-FR');
                }
              };

              return (
                <li key={index} className="activity-item">
                  <div className="activity-icon" style={{ backgroundColor: bgColor }}>
                    {icon}
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">{activity.description || activity.title || 'Activité'}</div>
                    <div className="activity-time">{formatDate(activity.date || activity.createdAt)}</div>
                  </div>
                </li>
              );
            })
          ) : (
            <>
              <li className="activity-item">
                <div className="activity-icon" style={{ backgroundColor: '#e3f2fd' }}>
                  <Users size={20} color="#2196F3" />
                </div>
                <div className="activity-content">
                  <div className="activity-title">Nouvel utilisateur inscrit</div>
                  <div className="activity-time">Il y a 2 heures</div>
                </div>
              </li>
              <li className="activity-item">
                <div className="activity-icon" style={{ backgroundColor: '#fce4ec' }}>
                  <Book size={20} color="#E91E63" />
                </div>
                <div className="activity-content">
                  <div className="activity-title">Nouveau cours ajouté: JavaScript Avancé</div>
                  <div className="activity-time">Il y a 5 heures</div>
                </div>
              </li>
              <li className="activity-item">
                <div className="activity-icon" style={{ backgroundColor: '#fff3e0' }}>
                  <Layers size={20} color="#FF9800" />
                </div>
                <div className="activity-content">
                  <div className="activity-title">Module mis à jour: Introduction à React</div>
                  <div className="activity-time">Hier</div>
                </div>
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
