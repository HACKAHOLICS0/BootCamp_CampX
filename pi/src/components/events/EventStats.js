import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import eventService from '../../services/eventService';
import './EventStats.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const EventStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchEventStats();
  }, []);

  const fetchEventStats = async () => {
    try {
      const response = await eventService.getEventStatistics();
      setStats(response);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch event statistics');
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading statistics...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!stats) return null;

  const categoryData = {
    labels: stats.categoryDistribution.map(item => item.category),
    datasets: [{
      label: 'Events par catégorie',
      data: stats.categoryDistribution.map(item => item.count),
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF'
      ]
    }]
  };

  const attendanceData = {
    labels: stats.monthlyAttendance.map(item => item.month),
    datasets: [{
      label: 'Participants par mois',
      data: stats.monthlyAttendance.map(item => item.count),
      backgroundColor: '#36A2EB'
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Statistiques des événements'
      }
    }
  };

  return (
    <Container className="event-stats-container">
      <h1 className="stats-title">Statistiques des Événements</h1>

      <Row className="stats-tabs">
        <Col>
          <button
            className={`stats-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Vue d'ensemble
          </button>
          <button
            className={`stats-tab ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Catégories
          </button>
          <button
            className={`stats-tab ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            Participation
          </button>
        </Col>
      </Row>

      {activeTab === 'overview' && (
        <Row className="stats-overview">
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <Card.Title>Total des événements</Card.Title>
                <div className="stat-value">{stats.totalEvents}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <Card.Title>Événements actifs</Card.Title>
                <div className="stat-value">{stats.activeEvents}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <Card.Title>Total participants</Card.Title>
                <div className="stat-value">{stats.totalAttendees}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body>
                <Card.Title>Taux de participation</Card.Title>
                <div className="stat-value">{stats.participationRate}%</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {activeTab === 'categories' && (
        <Row>
          <Col md={6}>
            <Card className="chart-card">
              <Card.Body>
                <Card.Title>Distribution par catégorie</Card.Title>
                <div className="chart-container">
                  <Pie data={categoryData} options={chartOptions} />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="chart-card">
              <Card.Body>
                <Card.Title>Top Catégories</Card.Title>
                <div className="top-categories">
                  {stats.topCategories.map((category, index) => (
                    <div key={index} className="category-item">
                      <span className="category-name">{category.name}</span>
                      <span className="category-count">{category.eventCount} événements</span>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {activeTab === 'attendance' && (
        <Row>
          <Col md={8}>
            <Card className="chart-card">
              <Card.Body>
                <Card.Title>Participation mensuelle</Card.Title>
                <div className="chart-container">
                  <Bar data={attendanceData} options={chartOptions} />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="chart-card">
              <Card.Body>
                <Card.Title>Top Événements</Card.Title>
                <div className="top-events">
                  {stats.topEvents.map((event, index) => (
                    <div key={index} className="event-item">
                      <span className="event-name">{event.title}</span>
                      <span className="event-attendees">{event.attendeeCount} participants</span>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default EventStats;



