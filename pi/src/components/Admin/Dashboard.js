import React, { useState, useEffect } from 'react';
import { Users, Book, FolderTree, Layers, Activity, TrendingUp, BarChart2 } from 'lucide-react';
import './styles/AdminPointsStyle.css';
import './styles/DashboardStyle.css';
import axios from 'axios';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';

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

// Enregistrer les composants Chart.js nécessaires
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    categories: 0,
    modules: 0,
    courses: 0
  });

  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState({
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
    datasets: [
      {
        label: 'Nouveaux utilisateurs',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Sera mis à jour avec des données réelles
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  });

  // État pour les activités récentes
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Assurez-vous que l'URL de base est correcte
        const baseURL = 'http://localhost:5000'; // ou votre URL de backend

        const [
          usersResponse,
          categoriesResponse,
          modulesResponse,
          coursesResponse,
          monthlyUsersResponse
        ] = await Promise.all([
          axios.get(`${baseURL}/api/admin/users/count`),
          axios.get(`${baseURL}/api/admin/categories/count`),
          axios.get(`${baseURL}/api/admin/modules/count`),
          axios.get(`${baseURL}/api/admin/courses/count`),
          axios.get(`${baseURL}/api/admin/users/monthly`) // Récupérer les données mensuelles
        ]);

        // Afficher les réponses complètes pour déboguer la structure
        console.log('Réponses brutes:', {
          users: usersResponse.data,
          categories: categoriesResponse.data,
          modules: modulesResponse.data,
          courses: coursesResponse.data,
          monthlyUsers: monthlyUsersResponse.data
        });

        // Vérifier la structure exacte de chaque réponse
        console.log('Structure users:', JSON.stringify(usersResponse.data));
        console.log('Structure categories:', JSON.stringify(categoriesResponse.data));
        console.log('Structure modules:', JSON.stringify(modulesResponse.data));
        console.log('Structure courses:', JSON.stringify(coursesResponse.data));
        console.log('Structure monthly users:', JSON.stringify(monthlyUsersResponse.data));

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

        // Traiter les données mensuelles d'utilisateurs
        if (monthlyUsersResponse.data && Array.isArray(monthlyUsersResponse.data)) {
          // Créer un tableau de 12 mois avec des valeurs à 0
          const monthlyUsers = Array(12).fill(0);

          // Remplir avec les données réelles
          monthlyUsersResponse.data.forEach(item => {
            if (item.month && typeof item.month === 'number' && item.month >= 1 && item.month <= 12) {
              monthlyUsers[item.month - 1] = item.count || 0;
            } else if (item.date) {
              const month = new Date(item.date).getMonth();
              monthlyUsers[month] = item.count || 0;
            }
          });

          setMonthlyData(prev => ({
            ...prev,
            datasets: [{
              ...prev.datasets[0],
              data: monthlyUsers
            }]
          }));
        }

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

  // Configuration des données pour le graphique circulaire
  const pieChartData = {
    labels: ['Cours', 'Modules', 'Catégories', 'Utilisateurs'],
    datasets: [
      {
        data: [stats.courses, stats.modules, stats.categories, stats.users],
        backgroundColor: [
          '#E91E63',
          '#FF9800',
          '#2196F3',
          '#4CAF50'
        ],
        borderColor: [
          '#C2185B',
          '#F57C00',
          '#1976D2',
          '#388E3C'
        ],
        borderWidth: 1
      }
    ]
  };

  // Configuration des options pour les graphiques
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            size: 12,
            weight: 'bold'
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'x', // Utiliser l'axe x pour les catégories (mois)
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            return `${tooltipItems[0].label} 2024`;
          },
          label: (context) => {
            return `Nouveaux utilisateurs: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Nombre d\'utilisateurs'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Mois'
        }
      }
    }
  };

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

      <div className="dashboard-charts">
        <div className="chart-container">
          <div className="chart-header">
            <h3>Répartition des Ressources</h3>
            <div className="chart-icon">
              <BarChart2 size={20} color="#333" />
            </div>
          </div>
          <div style={{ height: '300px', position: 'relative' }}>
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3>Nouveaux Utilisateurs (2024)</h3>
            <div className="chart-icon">
              <TrendingUp size={20} color="#333" />
            </div>
          </div>
          <div style={{ height: '300px', position: 'relative' }}>
            <Bar data={monthlyData} options={barChartOptions} />
          </div>
        </div>
      </div>

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
