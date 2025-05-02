import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Badge } from 'react-bootstrap';
import config from '../../config';

const EventNotification = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingEventsCount = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const response = await axios.get(`${config.apiBaseUrl}/events/admin/pending`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setPendingCount(response.data.length);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching pending events count:', err);
        setLoading(false);
      }
    };

    fetchPendingEventsCount();

    // Mettre à jour le compteur toutes les 5 minutes
    const interval = setInterval(fetchPendingEventsCount, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading || pendingCount === 0) {
    return null;
  }

  return (
    <Link to="/admin/pending-events" className="text-decoration-none">
      <div className="d-flex align-items-center bg-light p-2 rounded mb-3">
        <i className="bi bi-bell-fill text-warning me-2"></i>
        <span>You have </span>
        <Badge bg="warning" className="mx-1">{pendingCount}</Badge>
        <span>pending {pendingCount === 1 ? 'event' : 'events'} awaiting approval</span>
      </div>
    </Link>
  );
};

export default EventNotification;
