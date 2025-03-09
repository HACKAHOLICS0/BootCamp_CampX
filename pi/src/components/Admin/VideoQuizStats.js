import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, ProgressBar, Spinner } from 'react-bootstrap';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import Cookies from 'js-cookie';
import './VideoQuizStats.css';

// Enregistrer les composants ChartJS nécessaires
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const backendURL = "http://localhost:5000/api";

const VideoQuizStats = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [userResponses, setUserResponses] = useState([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const token = Cookies.get('token');
        const response = await fetch(`${backendURL}/videoquiz/statistics`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }

        const data = await response.json();
        setStatistics(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching statistics:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  const fetchUserResponses = async (userId) => {
    setLoadingResponses(true);
    try {
      const token = Cookies.get('token');
      const response = await fetch(`${backendURL}/videoquiz/user/responses/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user responses');
      }

      const data = await response.json();
      setUserResponses(data);
      setSelectedUser(userId);
      setLoadingResponses(false);
    } catch (error) {
      console.error('Error fetching user responses:', error);
      setLoadingResponses(false);
    }
  };

  if (loading) {
    return (
      <Container className="stats-loading">
        <Spinner animation="border" variant="primary" />
        <p>Loading statistics...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Card className="error-card">
          <Card.Body>
            <Card.Title className="text-danger">Error</Card.Title>
            <Card.Text>{error}</Card.Text>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // Données pour les graphiques
  const chartData = {
    engagement: {
      labels: statistics.videoEngagement.map(item => `Video ${item._id.substring(0, 6)}`),
      datasets: [
        {
          label: 'Nombre de réponses',
          data: statistics.videoEngagement.map(item => item.responseCount),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    },
    quizResults: {
      labels: ['Réponses correctes', 'Réponses incorrectes'],
      datasets: [
        {
          data: [
            statistics.correctResponses, 
            statistics.totalQuestions - statistics.correctResponses
          ],
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 99, 132, 0.6)',
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)',
          ],
          borderWidth: 1,
        },
      ],
    },
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Statistiques des quiz vidéo',
      },
    },
  };

  return (
    <Container fluid className="stats-container">
      <h1 className="stats-title">Tableau de bord des quiz vidéo interactifs</h1>
      
      <Row className="mb-4">
        <Col>
          <div className="stats-tabs">
            <button 
              className={`stats-tab ${activeTab === 'overview' ? 'active' : ''}`} 
              onClick={() => setActiveTab('overview')}
            >
              Vue d'ensemble
            </button>
            <button 
              className={`stats-tab ${activeTab === 'videos' ? 'active' : ''}`} 
              onClick={() => setActiveTab('videos')}
            >
              Vidéos populaires
            </button>
            <button 
              className={`stats-tab ${activeTab === 'users' ? 'active' : ''}`} 
              onClick={() => setActiveTab('users')}
            >
              Utilisateurs actifs
            </button>
          </div>
        </Col>
      </Row>

      {activeTab === 'overview' && (
        <>
          <Row className="mb-4">
            <Col md={3}>
              <Card className="stats-card">
                <Card.Body>
                  <Card.Title>Total des réponses</Card.Title>
                  <div className="stat-value">{statistics.totalResponses}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stats-card">
                <Card.Body>
                  <Card.Title>Questions répondues</Card.Title>
                  <div className="stat-value">{statistics.totalQuestions}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stats-card">
                <Card.Body>
                  <Card.Title>Réponses correctes</Card.Title>
                  <div className="stat-value">{statistics.correctResponses}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stats-card">
                <Card.Body>
                  <Card.Title>Taux de réussite</Card.Title>
                  <div className="stat-value">{statistics.correctRate}</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={7}>
              <Card className="chart-card">
                <Card.Body>
                  <Card.Title>Engagement par vidéo</Card.Title>
                  <div className="chart-container">
                    <Bar data={chartData.engagement} options={chartOptions} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={5}>
              <Card className="chart-card">
                <Card.Body>
                  <Card.Title>Répartition des réponses</Card.Title>
                  <div className="chart-container">
                    <Pie data={chartData.quizResults} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {activeTab === 'videos' && (
        <Row>
          <Col>
            <Card className="table-card">
              <Card.Body>
                <Card.Title>Vidéos les plus engageantes</Card.Title>
                <Table striped hover responsive>
                  <thead>
                    <tr>
                      <th>ID Vidéo</th>
                      <th>Nombre de réponses</th>
                      <th>Progression moyenne (%)</th>
                      <th>Engagement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.videoEngagement.map((video, index) => (
                      <tr key={index}>
                        <td>{video._id}</td>
                        <td>{video.responseCount}</td>
                        <td>{Math.round(video.averageProgress)}s</td>
                        <td>
                          <ProgressBar 
                            now={Math.min(100, (video.responseCount / Math.max(...statistics.videoEngagement.map(v => v.responseCount))) * 100)} 
                            variant="info" 
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {activeTab === 'users' && (
        <Row>
          <Col md={6}>
            <Card className="table-card">
              <Card.Body>
                <Card.Title>Utilisateurs les plus actifs</Card.Title>
                <Table striped hover responsive>
                  <thead>
                    <tr>
                      <th>ID Utilisateur</th>
                      <th>Nombre de réponses</th>
                      <th>Score moyen</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.activeUsers.map((user, index) => (
                      <tr key={index}>
                        <td>{user._id}</td>
                        <td>{user.responseCount}</td>
                        <td>{Math.round(user.averageScore * 100) / 100}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => fetchUserResponses(user._id)}
                          >
                            Voir détails
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6}>
            {loadingResponses ? (
              <div className="user-responses-loading">
                <Spinner animation="border" variant="primary" size="sm" />
                <span>Chargement des réponses...</span>
              </div>
            ) : selectedUser ? (
              <Card className="user-responses-card">
                <Card.Body>
                  <Card.Title>Réponses de l'utilisateur {selectedUser}</Card.Title>
                  {userResponses.length > 0 ? (
                    <div className="user-responses">
                      {userResponses.map((response, index) => (
                        <div key={index} className="user-response-item">
                          <h5>
                            {response.videoId?.title || 'Vidéo'} 
                            <Badge bg={response.completed ? 'success' : 'warning'} className="ms-2">
                              {response.completed ? 'Complété' : 'En cours'}
                            </Badge>
                          </h5>
                          <p>Progression: {response.videoProgress} secondes</p>
                          <p>Score total: {response.totalScore} points</p>
                          <p>Réponses: {response.responses.length}</p>
                          
                          {response.responses.length > 0 && (
                            <Table size="sm" bordered>
                              <thead>
                                <tr>
                                  <th>Question</th>
                                  <th>Réponse</th>
                                  <th>Résultat</th>
                                </tr>
                              </thead>
                              <tbody>
                                {response.responses.map((r, idx) => (
                                  <tr key={idx}>
                                    <td>{r.questionId}</td>
                                    <td>{r.selectedOption}</td>
                                    <td>
                                      <Badge bg={r.isCorrect ? 'success' : 'danger'}>
                                        {r.isCorrect ? 'Correct' : 'Incorrect'}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>Aucune réponse trouvée pour cet utilisateur.</p>
                  )}
                </Card.Body>
              </Card>
            ) : (
              <div className="user-select-message">
                Sélectionnez un utilisateur pour voir ses réponses détaillées.
              </div>
            )}
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default VideoQuizStats;
