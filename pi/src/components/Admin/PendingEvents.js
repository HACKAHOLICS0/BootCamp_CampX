import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Alert, Badge, Modal, Form, Spinner, Card } from 'react-bootstrap';
import { format } from 'date-fns';
import Cookies from 'js-cookie';
import config from '../../config';
import { getEventImageUrl } from '../../utils/imageUtils';

const PendingEvents = () => {
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [currentEvent, setCurrentEvent] = useState(null);
  const [notification, setNotification] = useState(null);

  // Récupérer les événements en attente
  const fetchPendingEvents = async () => {
    try {
      setLoading(true);

      // Récupérer le token depuis localStorage ou cookies
      const localStorageToken = localStorage.getItem('token');
      const cookieToken = Cookies.get('token');
      const token = localStorageToken || cookieToken || '';

      console.log('Token used for authentication:', token ? 'Token exists' : 'No token found');

      // Afficher les en-têtes pour le débogage
      const headers = {
        Authorization: `Bearer ${token}`
      };
      console.log('Request headers:', headers);

      // Afficher l'URL complète pour le débogage
      const url = `${config.apiBaseUrl}/events/admin/pending`;
      console.log('Request URL:', url);

      const response = await axios.get(url, { headers });

      console.log('Response status:', response.status);
      console.log('Response data:', response.data);

      setPendingEvents(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching pending events:', err);
      console.error('Error details:', err.response ? err.response.data : 'No response data');
      console.error('Error status:', err.response ? err.response.status : 'No status code');
      setError('Failed to load pending events. Please try again later.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingEvents();
  }, []);

  // Approuver un événement
  const approveEvent = async (eventId) => {
    try {
      // Récupérer le token depuis localStorage ou cookies
      const localStorageToken = localStorage.getItem('token');
      const cookieToken = Cookies.get('token');
      const token = localStorageToken || cookieToken || '';

      console.log('Approving event with ID:', eventId);
      console.log('Token used for approval:', token ? 'Token exists' : 'No token found');

      // Afficher l'URL complète pour le débogage
      const url = `${config.apiBaseUrl}/events/${eventId}/approve`;
      console.log('Request URL:', url);

      // Afficher les en-têtes pour le débogage
      const headers = {
        Authorization: `Bearer ${token}`
      };
      console.log('Request headers:', headers);

      const response = await axios.post(url, {}, { headers });

      console.log('Approval response status:', response.status);
      console.log('Approval response data:', response.data);

      // Mettre à jour la liste des événements en attente
      setPendingEvents(pendingEvents.filter(event => event._id !== eventId));

      // Afficher une notification
      setNotification({
        type: 'success',
        message: 'Event approved successfully!'
      });

      // Masquer la notification après 3 secondes
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (err) {
      console.error('Error approving event:', err);
      console.error('Error details:', err.response ? err.response.data : 'No response data');
      console.error('Error status:', err.response ? err.response.status : 'No status code');

      setNotification({
        type: 'danger',
        message: `Failed to approve event: ${err.response ? err.response.data.message : err.message}`
      });
    }
  };

  // Ouvrir le modal de rejet
  const openRejectModal = (event) => {
    setCurrentEvent(event);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  // Rejeter un événement
  const rejectEvent = async () => {
    if (!rejectionReason.trim()) {
      setNotification({
        type: 'danger',
        message: 'Please provide a reason for rejection.'
      });
      return;
    }

    try {
      // Récupérer le token depuis localStorage ou cookies
      const localStorageToken = localStorage.getItem('token');
      const cookieToken = Cookies.get('token');
      const token = localStorageToken || cookieToken || '';

      console.log('Rejecting event with ID:', currentEvent._id);
      console.log('Rejection reason:', rejectionReason);
      console.log('Token used for rejection:', token ? 'Token exists' : 'No token found');

      // Afficher l'URL complète pour le débogage
      const url = `${config.apiBaseUrl}/events/${currentEvent._id}/reject`;
      console.log('Request URL:', url);

      // Afficher les en-têtes et le corps de la requête pour le débogage
      const headers = {
        Authorization: `Bearer ${token}`
      };
      console.log('Request headers:', headers);
      console.log('Request body:', { reason: rejectionReason });

      const response = await axios.post(
        url,
        { reason: rejectionReason },
        { headers }
      );

      console.log('Rejection response status:', response.status);
      console.log('Rejection response data:', response.data);

      // Fermer le modal
      setShowRejectModal(false);

      // Mettre à jour la liste des événements en attente
      setPendingEvents(pendingEvents.filter(event => event._id !== currentEvent._id));

      // Afficher une notification
      setNotification({
        type: 'success',
        message: 'Event rejected successfully!'
      });

      // Masquer la notification après 3 secondes
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (err) {
      console.error('Error rejecting event:', err);
      console.error('Error details:', err.response ? err.response.data : 'No response data');
      console.error('Error status:', err.response ? err.response.status : 'No status code');

      // Fermer le modal malgré l'erreur
      setShowRejectModal(false);

      setNotification({
        type: 'danger',
        message: `Failed to reject event: ${err.response ? err.response.data.message : err.message}`
      });
    }
  };

  // Fonction pour tester l'authentification admin
  const testAdminAuth = async () => {
    try {
      setLoading(true);

      // Récupérer le token depuis localStorage ou cookies
      const localStorageToken = localStorage.getItem('token');
      const cookieToken = Cookies.get('token');
      const token = localStorageToken || cookieToken || '';

      console.log('Testing admin auth with token:', token ? 'Token exists' : 'No token found');

      const response = await axios.get(`${config.apiBaseUrl}/events/admin/check-auth`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Admin auth test response:', response.data);

      setNotification({
        type: 'success',
        message: `Authentication successful! User: ${response.data.user.name}, Role: ${response.data.user.typeUser}`
      });

      // Réessayer de charger les événements en attente
      fetchPendingEvents();
    } catch (err) {
      console.error('Admin auth test error:', err);
      console.error('Error details:', err.response ? err.response.data : 'No response data');

      setNotification({
        type: 'danger',
        message: `Authentication failed: ${err.response ? err.response.data.message : err.message}`
      });

      setLoading(false);
    }
  };

  // Fonction pour tester l'approbation d'un événement spécifique
  const testApproveEvent = async (eventId) => {
    try {
      // Récupérer le token depuis localStorage ou cookies
      const localStorageToken = localStorage.getItem('token');
      const cookieToken = Cookies.get('token');
      const token = localStorageToken || cookieToken || '';

      console.log('Testing event approval with ID:', eventId);
      console.log('Token used for test:', token ? 'Token exists' : 'No token found');

      // Afficher l'URL complète pour le débogage
      const url = `${config.apiBaseUrl}/events/admin/test-approve/${eventId}`;
      console.log('Test URL:', url);

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Test approval response:', response.data);

      setNotification({
        type: 'success',
        message: `Event can be approved: ${response.data.event.title}`
      });
    } catch (err) {
      console.error('Test approval error:', err);
      console.error('Error details:', err.response ? err.response.data : 'No response data');

      setNotification({
        type: 'danger',
        message: `Test approval failed: ${err.response ? err.response.data.message : err.message}`
      });
    }
  };

  // Fonction pour tester le rejet d'un événement spécifique
  const testRejectEvent = async (eventId) => {
    try {
      // Récupérer le token depuis localStorage ou cookies
      const localStorageToken = localStorage.getItem('token');
      const cookieToken = Cookies.get('token');
      const token = localStorageToken || cookieToken || '';

      console.log('Testing event rejection with ID:', eventId);
      console.log('Token used for test:', token ? 'Token exists' : 'No token found');

      // Afficher l'URL complète pour le débogage
      const url = `${config.apiBaseUrl}/events/admin/test-reject/${eventId}`;
      console.log('Test URL:', url);

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Test rejection response:', response.data);

      setNotification({
        type: 'success',
        message: `Event can be rejected: ${response.data.event.title}`
      });

      // Ne pas fermer le modal pour permettre à l'utilisateur de continuer avec le rejet
    } catch (err) {
      console.error('Test rejection error:', err);
      console.error('Error details:', err.response ? err.response.data : 'No response data');

      setNotification({
        type: 'danger',
        message: `Test rejection failed: ${err.response ? err.response.data.message : err.message}`
      });
    }
  };

  if (loading) return <div className="text-center my-5"><div className="spinner-border" role="status"></div></div>;

  if (error) return (
    <div className="container mt-4">
      <Alert variant="danger">{error}</Alert>
      <Button variant="primary" onClick={testAdminAuth}>
        Test Admin Authentication
      </Button>
    </div>
  );

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Pending Events</h2>

      <Button variant="outline-primary" className="mb-3" onClick={testAdminAuth}>
        Test Admin Authentication
      </Button>

      {notification && (
        <Alert variant={notification.type} onClose={() => setNotification(null)} dismissible>
          {notification.message}
        </Alert>
      )}

      {pendingEvents.length === 0 ? (
        <Alert variant="info">No pending events to approve.</Alert>
      ) : (
        <div className="row">
          {pendingEvents.map(event => (
            <div className="col-md-6 col-lg-4 mb-4" key={event._id}>
              <Card>
                {event.image && event.image !== 'undefined' && (
             <Card.Img
  variant="top"
  src={getEventImageUrl(event)}
  alt={event.title}
  style={{ height: '200px', objectFit: 'cover' }}
  onError={(e) => {
    console.error('Error loading image:', e);
    console.log('Event image data:', event.image);
    console.log('Constructed image URL:', getEventImageUrl(event));
    // Utiliser l'URL complète pour l'image par défaut
    e.target.src = `${config.apiBaseUrl}/uploads/events/default-event.jpg`;
  }}
/>                )}
                <Card.Body>
                  <Card.Title>{event.title}</Card.Title>
                  <Badge bg="warning" className="mb-2">Pending</Badge>
                  <Card.Text className="mb-1">
                    <strong>Date:</strong> {format(new Date(event.date), 'PPP')}
                  </Card.Text>
                  <Card.Text className="mb-1">
                    <strong>Location:</strong> {event.location}
                  </Card.Text>
                  <Card.Text className="mb-1">
                    <strong>Category:</strong> {event.category}
                  </Card.Text>
                  <Card.Text className="mb-1">
                    <strong>Max Attendees:</strong> {event.maxAttendees}
                  </Card.Text>
                  <Card.Text className="mb-3">
                    <strong>Organizer:</strong> {event.organizer?.name || 'Unknown'}
                  </Card.Text>
                  <Card.Text>{event.description}</Card.Text>
                  <div className="d-flex justify-content-between mt-3">
                    <Button
                      variant="success"
                      onClick={() => approveEvent(event._id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => openRejectModal(event)}
                    >
                      Reject
                    </Button>
                  </div>
                  <div className="mt-2">
                    <Button
                      variant="outline-info"
                      size="sm"
                      onClick={() => testApproveEvent(event._id)}
                      className="w-100"
                    >
                      Test Approval
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Modal de rejet */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reject Event</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Please provide a reason for rejecting "{currentEvent?.title}":</p>
          <Form.Group>
            <Form.Control
              as="textarea"
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
            Cancel
          </Button>
          <Button variant="outline-info" onClick={() => testRejectEvent(currentEvent._id)}>
            Test Rejection
          </Button>
          <Button variant="danger" onClick={rejectEvent}>
            Reject Event
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PendingEvents;
