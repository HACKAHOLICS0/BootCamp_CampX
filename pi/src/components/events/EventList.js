import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { getEventImageUrl } from '../../utils/imageUtils';
import eventService from '../../services/eventService';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const EventList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const userData = Cookies.get('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data = await eventService.getAllEvents();
                setEvents(data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch events');
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const handleDelete = async (eventId) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await eventService.deleteEvent(eventId);
                setEvents(events.filter(event => event._id !== eventId));
            } catch (err) {
                setError('Failed to delete event');
            }
        }
    };

    const handleParticipate = async (eventId) => {
        try {
            // Vérifier si l'utilisateur est connecté
            const token = localStorage.getItem('token') || Cookies.get('token');
            if (!token) {
                toast.error('Please sign in to register for this event');
                navigate('/signin');
                return;
            }

            // Afficher un indicateur de chargement
            setLoading(true);
            
            // Appeler le service pour s'inscrire à l'événement
            const response = await eventService.registerForEvent(eventId);
            
            // Afficher un message de succès
            toast.success('Successfully registered for the event!');
            
            // Rafraîchir la liste des événements pour mettre à jour le nombre de participants
            const updatedEvents = await eventService.getAllEvents();
            setEvents(updatedEvents);
        } catch (err) {
            // Afficher un message d'erreur plus détaillé
            const errorMessage = err.message || 'Failed to register for event';
            toast.error(errorMessage);
            
            // Si l'erreur est liée à l'authentification, rediriger vers la page de connexion
            if (errorMessage.includes('Authentication required') || 
                errorMessage.includes('session has expired') ||
                errorMessage.includes('token')) {
                setTimeout(() => {
                    navigate('/signin');
                }, 2000);
            }
        } finally {
            // Désactiver l'indicateur de chargement
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="text-center my-4">
            <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading events...</span>
            </Spinner>
        </div>
    );
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="event-list">
            <div className="event-list-header">
                <h2>Events</h2>
                {user && (
                    <Link to="/events/create" className="btn btn-primary">
                        Create Event
                    </Link>
                )}
            </div>
            <Row xs={1} md={2} lg={3} className="g-4">
                {events.map(event => (
                    <Col key={event._id}>
                        <Card className="h-100 event-card">
                            {event.image && event.image !== 'undefined' && (
                                <Card.Img 
                                    variant="top" 
                                    src={getEventImageUrl(event)} 
                                    alt={event.title}
                                    style={{ height: '200px', objectFit: 'cover' }}
                                />
                            )}
                            <Card.Body>
                                <h3>{event.title}</h3>
                                <p className="event-date">
                                    {format(new Date(event.date), 'dd/MM/yyyy')}
                                </p>
                                <p className="event-location">{event.location}</p>
                                <p className="event-description">{event.description}</p>
                                <div className="event-meta">
                                    <span>Attendees: {event.attendees.length}/{event.maxAttendees}</span>
                                    <span className={`status ${event.status}`}>{event.status}</span>
                                </div>
                                <div className="event-actions">
                                    <Link to={`/events/${event._id}`} className="btn btn-primary">
                                        View Details
                                    </Link>
                                    {user && (
                                        <>
                                            {user._id === event.organizer ? (
                                                <>
                                                    <Link to={`/events/${event._id}/edit`} className="btn btn-secondary">
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(event._id)}
                                                        className="btn btn-danger"
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            ) : (
                                                !event.attendees.includes(user._id) && (
                                                    <button
                                                        onClick={() => handleParticipate(event._id)}
                                                        className="btn btn-success"
                                                        disabled={event.attendees.length >= event.maxAttendees}
                                                    >
                                                        Participate
                                                    </button>
                                                )
                                            )}
                                        </>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default EventList; 
