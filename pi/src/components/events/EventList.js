import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { getEventImageUrl } from '../../utils/imageUtils';
import eventService from '../../services/eventService';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import './EventList.css';

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
            // V�rifier si l'utilisateur est connect�
            const token = localStorage.getItem('token') || Cookies.get('token');
            if (!token) {
                toast.error('Please sign in to register for this event');
                navigate('/signin');
                return;
            }

            // Afficher un indicateur de chargement
            setLoading(true);

            // Appeler le service pour s'inscrire � l'�v�nement
            const response = await eventService.registerForEvent(eventId);

            // Afficher un message de succ�s
            toast.success('Successfully registered for the event!');

            // Rafra�chir la liste des �v�nements pour mettre � jour le nombre de participants
            const updatedEvents = await eventService.getAllEvents();
            setEvents(updatedEvents);
        } catch (err) {
            // Afficher un message d'erreur plus d�taill�
            const errorMessage = err.message || 'Failed to register for event';
            toast.error(errorMessage);

            // Si l'erreur est li�e � l'authentification, rediriger vers la page de connexion
            if (errorMessage.includes('Authentication required') ||
                errorMessage.includes('session has expired') ||
                errorMessage.includes('token')) {
                setTimeout(() => {
                    navigate('/signin');
                }, 2000);
            }
        } finally {
            // D�sactiver l'indicateur de chargement
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="text-center my-4">
            <Spinner animation="border" role="status" className="custom-spinner">
                <span className="visually-hidden">Chargement des événements...</span>
            </Spinner>
            <p className="loading-text">Chargement des événements...</p>
        </div>
    );

    if (error) return (
        <div className="events-container">
            <Alert variant="danger" className="custom-error">
                <div className="error-icon">⚠️</div>
                <h3>Une erreur est survenue</h3>
                <p>{error}</p>
                <Button
                    variant="outline-danger"
                    onClick={() => window.location.reload()}
                    className="retry-button"
                >
                    Réessayer
                </Button>
            </Alert>
        </div>
    );

    return (
        <div>
            <div className="events-page-header">
                <h1 className="events-page-title">Événements</h1>
                <p className="events-page-subtitle">Découvrez et participez à nos événements</p>
            </div>

            <div className="events-container">
                {user && (
                    <Link to="/events/create" className="create-event-button">
                        <i className="bi bi-plus-circle"></i> Créer un événement
                    </Link>
                )}

                {events.length === 0 ? (
                    <Alert variant="info" className="mt-4">
                        <p className="mb-0">Aucun événement n'est disponible pour le moment.</p>
                        <p className="mb-0">Revenez bientôt pour découvrir nos prochains événements !</p>
                    </Alert>
                ) : (
                    <div className="events-grid">
                        {events.map(event => (
                            <div key={event._id} className="event-card">
                                {event.image && event.image !== 'undefined' && (
                                    <div className="event-image-container">
                                        <img
                                            src={getEventImageUrl(event)}
                                            alt={event.title}
                                            className="event-image"
                                        />
                                    </div>
                                )}
                                <div className="event-content">
                                    <h3 className="event-title">{event.title}</h3>
                                    <div className="event-info">
                                        <div className="event-date">
                                            <i className="bi bi-calendar-event"></i>
                                            {format(new Date(event.date), 'dd MMMM yyyy, HH:mm')}
                                        </div>
                                        <div className="event-location">
                                            <i className="bi bi-geo-alt"></i>
                                            {event.location}
                                        </div>
                                    </div>
                                    <p className="event-description">{event.description}</p>
                                    <div className="event-footer">
                                        <div className="event-attendees">
                                            <i className="bi bi-people"></i>
                                            <span>{event.attendees.length}/{event.maxAttendees} participants</span>
                                        </div>
                                        <div className={`event-status ${event.status}`}>
                                            {event.status}
                                        </div>
                                    </div>
                                    <div className="event-actions">
                                        <Link to={`/events/${event._id}`} className="btn btn-view">
                                            Voir détails
                                        </Link>
                                        {user && (
                                            <>
                                                {user._id === event.organizer ? (
                                                    <>
                                                        <Link to={`/events/${event._id}/edit`} className="btn btn-secondary">
                                                            Modifier
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(event._id)}
                                                            className="btn btn-danger"
                                                        >
                                                            Supprimer
                                                        </button>
                                                    </>
                                                ) : (
                                                    !event.attendees.includes(user._id) && (
                                                        <button
                                                            onClick={() => handleParticipate(event._id)}
                                                            className="btn btn-participate"
                                                            disabled={event.attendees.length >= event.maxAttendees}
                                                        >
                                                            Participer
                                                        </button>
                                                    )
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventList;
