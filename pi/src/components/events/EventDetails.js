import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Modal } from 'react-bootstrap';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import eventService from '../../services/eventService';
import recommendationService from '../../services/recommendationService';
import SimilarEvents from './SimilarEvents';
import EventLocationMap from '../maps/EventLocationMap';
import './EventDetails.css';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarLinks, setCalendarLinks] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [qrCodeError, setQrCodeError] = useState(false);

  useEffect(() => {
    // Récupérer l'utilisateur depuis les cookies ou localStorage
    const userFromCookie = Cookies.get('user');
    const userFromLocalStorage = localStorage.getItem('user');

    if (userFromLocalStorage) {
      setUser(JSON.parse(userFromLocalStorage));
    } else if (userFromCookie) {
      setUser(JSON.parse(userFromCookie));
    }

    fetchEventDetails();

    // Enregistrer l'interaction de visualisation
    if (id) {
      recordViewInteraction();
    }
  }, [id]);

  // Enregistrer l'interaction de visualisation
  const recordViewInteraction = async () => {
    try {
      if (user) {
        await recommendationService.recordInteraction(id, 'viewed');
      }
    } catch (error) {
      console.error('Error recording view interaction:', error);
      // Ne pas afficher d'erreur à l'utilisateur pour cette opération silencieuse
    }
  };

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const data = await eventService.getEvent(id);
      setEvent(data);

      // Vérifier si l'utilisateur est déjà inscrit
      if (user && data.attendees.includes(user._id)) {
        setIsRegistered(true);
      }

      setLoading(false);
    } catch (err) {
      setError('Failed to fetch event details');
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      toast.error('Please sign in to register for this event');
      navigate('/signin');
      return;
    }

    try {
      setLoading(true);
      const response = await eventService.registerForEvent(id);

      // Afficher un message de succès
      toast.success('Successfully registered for the event!');
      setIsRegistered(true);

      // Afficher un modal pour proposer d'ajouter l'événement au calendrier
      if (response.calendarLinks) {
        setCalendarLinks(response.calendarLinks);
        setShowCalendarModal(true);
      }

      // Si un QR code a été généré, le stocker
      if (response.qrCodeUrl) {
        setQrCodeUrl(response.qrCodeUrl);
      }

      // Refresh event data to update attendee count
      fetchEventDetails();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonctions pour ajouter l'événement au calendrier
  const addToGoogleCalendar = async () => {
    try {
      await eventService.openGoogleCalendar(id);
    } catch (error) {
      toast.error('Failed to open Google Calendar');
    }
  };

  const addToAppleCalendar = async () => {
    try {
      await eventService.openAppleCalendar(id);
    } catch (error) {
      toast.error('Failed to open Apple Calendar');
    }
  };

  const downloadICalendarFile = () => {
    try {
      eventService.openICalendarFile(id);
    } catch (error) {
      toast.error('Failed to download iCalendar file');
    }
  };

  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!event) {
    return (
      <Container className="my-5">
        <Alert variant="warning">Event not found</Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <Row>
        <Col md={8}>
          <Card className="event-details-card">
            {event.image && (
              <Card.Img variant="top" src={`http://localhost:5002/${event.image}`} alt={event.title} />
            )}
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title className="mb-0">{event.title}</Card.Title>
                <Badge bg={event.isApproved ? 'success' : 'warning'}>
                  {event.isApproved ? 'Approved' : 'Pending Approval'}
                </Badge>
              </div>

              <Card.Text className="event-description">{event.description}</Card.Text>

              <Row className="event-info mt-4">
                <Col md={6}>
                  <p><strong>Date:</strong> {format(new Date(event.date), 'PPP')}</p>
                  <p><strong>Location:</strong> {event.location}</p>
                  <p><strong>Category:</strong> {event.category}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Status:</strong> {event.status}</p>
                  <p><strong>Attendees:</strong> {event.attendees.length}/{event.maxAttendees}</p>
                  <p><strong>Organizer:</strong> {event.organizer?.name || 'Unknown'}</p>
                </Col>
              </Row>

              {qrCodeUrl && (
                <div className="qr-code-container mt-4 text-center">
                  <h5>Event QR Code</h5>
                  <img
                    src={qrCodeUrl.startsWith('http') ? qrCodeUrl : `http://localhost:5002${qrCodeUrl}`}
                    alt="Event QR Code"
                    className="qr-code-image"
                    onError={(e) => {
                      console.error('Error loading QR code:', e);
                      console.error('QR code URL:', qrCodeUrl);
                      e.target.src = 'https://via.placeholder.com/150?text=QR+Code+Not+Available';
                      setQrCodeError(true);
                    }}
                  />
                  {qrCodeError && (
                    <Alert variant="warning" className="mt-2">
                      QR code could not be loaded. Please try again later.
                    </Alert>
                  )}
                  <p className="mt-2">Scan this QR code to access event details</p>
                </div>
              )}

              <div className="event-actions mt-4">
                {user && user._id === event.organizer ? (
                  <>
                    <Link to={`/events/${event._id}/edit`} className="btn btn-primary me-2">
                      Edit Event
                    </Link>
                    <Button variant="danger">
                      Delete Event
                    </Button>
                  </>
                ) : (
                  <>
                    {isRegistered ? (
                      <div>
                        <Badge bg="success" className="p-2 mb-3">You are registered for this event</Badge>
                        <div className="calendar-buttons">
                          <Button variant="outline-primary" className="me-2" onClick={addToGoogleCalendar}>
                            Add to Google Calendar
                          </Button>
                          <Button variant="outline-primary" className="me-2" onClick={downloadICalendarFile}>
                            Download iCalendar File
                          </Button>
                          <Button variant="outline-primary" onClick={addToAppleCalendar}>
                            Add to Apple Calendar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="success"
                        onClick={handleRegister}
                        disabled={event.attendees.length >= event.maxAttendees || !event.isApproved}
                      >
                        {event.attendees.length >= event.maxAttendees
                          ? 'Event is Full'
                          : !event.isApproved
                            ? 'Event Pending Approval'
                            : 'Register for Event'}
                      </Button>
                    )}
                  </>
                )}

                <Link to="/events" className="btn btn-link mt-3">
                  Back to Events
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Event Location</Card.Title>
              <EventLocationMap
                location={event.location}
                isOnlineEvent={event.location.toLowerCase().includes('online') ||
                              event.location.toLowerCase().includes('virtual') ||
                              event.location.toLowerCase().includes('zoom') ||
                              event.location.toLowerCase().includes('teams') ||
                              event.location.toLowerCase().includes('meet')}
              />
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <Card.Title>Share Event</Card.Title>
              <div className="share-buttons mt-3">
                <Button
                  variant="outline-primary"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Event link copied to clipboard!');
                  }}
                >
                  Copy Link
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Similar Events Section */}
      <Row className="mt-5">
        <Col>
          <SimilarEvents eventId={id} limit={3} />
        </Col>
      </Row>

      {/* Modal pour ajouter l'événement au calendrier */}
      <Modal show={showCalendarModal} onHide={() => setShowCalendarModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Event to Calendar</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>You've successfully registered for <strong>{event.title}</strong>!</p>
          <p>Would you like to add this event to your calendar?</p>
          <div className="d-grid gap-2">
            <Button variant="primary" onClick={addToGoogleCalendar}>
              Add to Google Calendar
            </Button>
            <Button variant="outline-primary" onClick={downloadICalendarFile}>
              Download iCalendar File (.ics)
            </Button>
            <Button variant="outline-primary" onClick={addToAppleCalendar}>
              Add to Apple Calendar
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCalendarModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EventDetails;