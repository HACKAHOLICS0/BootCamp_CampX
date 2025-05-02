import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Badge, Alert, Spinner, Modal, Form } from 'react-bootstrap';
import { format } from 'date-fns';
import config from '../../config';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [notification, setNotification] = useState(null);

  // Récupérer tous les événements
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || '';
      const response = await axios.get(`${config.apiBaseUrl}/events`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setEvents(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Ouvrir le modal de suppression
  const openDeleteModal = (event) => {
    setCurrentEvent(event);
    setShowDeleteModal(true);
  };

  // Supprimer un événement
  const deleteEvent = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      await axios.delete(`${config.apiBaseUrl}/events/${currentEvent._id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Fermer le modal
      setShowDeleteModal(false);
      
      // Mettre à jour la liste des événements
      setEvents(events.filter(event => event._id !== currentEvent._id));
      
      // Afficher une notification
      setNotification({
        type: 'success',
        message: 'Event deleted successfully!'
      });
      
      // Masquer la notification après 3 secondes
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (err) {
      console.error('Error deleting event:', err);
      setNotification({
        type: 'danger',
        message: 'Failed to delete event. Please try again.'
      });
    }
  };

  // Fonction pour afficher le statut avec un badge coloré
  const renderStatus = (status, isApproved) => {
    let variant = 'secondary';
    let text = status;
    
    if (!isApproved) {
      variant = 'warning';
      text = 'Pending Approval';
    } else if (status === 'upcoming') {
      variant = 'primary';
    } else if (status === 'ongoing') {
      variant = 'success';
    } else if (status === 'completed') {
      variant = 'info';
    } else if (status === 'cancelled') {
      variant = 'danger';
    }
    
    return <Badge bg={variant}>{text}</Badge>;
  };

  if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
  
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">All Events</h2>
      
      {notification && (
        <Alert variant={notification.type} onClose={() => setNotification(null)} dismissible>
          {notification.message}
        </Alert>
      )}
      
      {events.length === 0 ? (
        <Alert variant="info">No events found.</Alert>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Location</th>
                <th>Category</th>
                <th>Status</th>
                <th>Organizer</th>
                <th>Attendees</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event._id}>
                  <td>{event.title}</td>
                  <td>{format(new Date(event.date), 'PPP')}</td>
                  <td>{event.location}</td>
                  <td>{event.category}</td>
                  <td>{renderStatus(event.status, event.isApproved)}</td>
                  <td>{event.organizer?.name || 'Unknown'}</td>
                  <td>{event.attendees?.length || 0} / {event.maxAttendees}</td>
                  <td>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      onClick={() => openDeleteModal(event)}
                      className="me-2"
                    >
                      Delete
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      href={`/events/${event._id}`}
                      target="_blank"
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      
      {/* Modal de suppression */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Event</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete the event "{currentEvent?.title}"?</p>
          <p className="text-danger">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteEvent}>
            Delete Event
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Events;
