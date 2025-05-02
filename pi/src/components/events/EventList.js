import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import eventService from '../../services/eventService';
import './EventList.css';
import Cookies from 'js-cookie';

const EventList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);

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
            await eventService.registerForEvent(eventId);
            // Refresh events to update attendee count
            const updatedEvents = await eventService.getAllEvents();
            setEvents(updatedEvents);
        } catch (err) {
            setError('Failed to register for event');
        }
    };

    if (loading) return <div className="loading">Loading...</div>;
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
            <div className="events-grid">
                {events.map(event => (
                    <div key={event._id} className="event-card">
                        {event.image && (
                            <img src={event.image} alt={event.title} className="event-image" />
                        )}
                        <div className="event-content">
                            <h3>{event.title}</h3>
                            <p className="event-date">
                                {new Date(event.date).toLocaleDateString()}
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
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EventList; 