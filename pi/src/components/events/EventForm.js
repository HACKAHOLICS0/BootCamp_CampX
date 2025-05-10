import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import eventService from '../../services/eventService';
import './EventForm.css';
import Cookies from 'js-cookie';

const EventForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        location: '',
        maxAttendees: '',
        category: '',
        image: null,
        status: 'pending'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = Cookies.get('user');
        if (userData) {
            setUser(JSON.parse(userData));
        } else {
            navigate('/signin');
        }
    }, [navigate]);

    useEffect(() => {
        if (id) {
            const fetchEvent = async () => {
                try {
                    const event = await eventService.getEvent(id);
                    if (event.organizer !== user._id) {
                        navigate('/events');
                        return;
                    }
                    setFormData({
                        ...event,
                        date: new Date(event.date).toISOString().split('T')[0]
                    });
                } catch (err) {
                    setError('Failed to fetch event');
                }
            };
            fetchEvent();
        }
    }, [id, user, navigate]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: files ? files[0] : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (id) {
                await eventService.updateEvent(id, formData);
            } else {
                await eventService.createEvent(formData);
            }
            navigate('/events');
        } catch (err) {
            setError(err.message || 'Failed to save event');
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div>
            <div className="event-form-page-header">
                <h1 className="event-form-page-title">
                    {id ? 'Modifier l\'événement' : 'Créer un événement'}
                </h1>
            </div>
            
            <div className="event-form-container">
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit} className="event-form">
                    <div className="form-group">
                        <label htmlFor="title">Title</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="date">Date</label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="location">Location</label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="maxAttendees">Maximum Attendees</label>
                        <input
                            type="number"
                            id="maxAttendees"
                            name="maxAttendees"
                            value={formData.maxAttendees}
                            onChange={handleChange}
                            required
                            min="1"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="category">Category</label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select a category</option>
                            <option value="workshop">Workshop</option>
                            <option value="conference">Conference</option>
                            <option value="meetup">Meetup</option>
                            <option value="hackathon">Hackathon</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="image">Event Image</label>
                        <input
                            type="file"
                            id="image"
                            name="image"
                            onChange={handleChange}
                            accept="image/*"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            {loading ? 'Saving...' : 'Save Event'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/events')}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventForm; 
