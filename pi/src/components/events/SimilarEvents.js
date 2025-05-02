import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import recommendationService from '../../services/recommendationService';
import './EventRecommendations.css'; // Réutiliser les styles des recommandations

/**
 * Composant pour afficher des événements similaires à un événement spécifique
 */
const SimilarEvents = ({ eventId, limit = 3 }) => {
    const [similarEvents, setSimilarEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fonction pour charger les événements similaires
        const loadSimilarEvents = async () => {
            if (!eventId) return;
            
            try {
                setLoading(true);
                const data = await recommendationService.getSimilarEvents(eventId, limit);
                setSimilarEvents(data);
                setError(null);
            } catch (err) {
                console.error('Error loading similar events:', err);
                setError('Failed to load similar events.');
            } finally {
                setLoading(false);
            }
        };

        // Charger les événements similaires au montage du composant ou lorsque eventId change
        loadSimilarEvents();
    }, [eventId, limit]);

    // Fonction pour formater la date
    const formatDate = (dateString) => {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Fonction pour enregistrer une interaction de visualisation
    const recordViewInteraction = async (id) => {
        try {
            await recommendationService.recordInteraction(id, 'viewed');
        } catch (err) {
            console.error('Error recording view interaction:', err);
            // Ne pas afficher d'erreur à l'utilisateur pour cette opération silencieuse
        }
    };

    // Si chargement en cours, afficher un spinner
    if (loading) {
        return (
            <div className="text-center my-4">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading similar events...</span>
                </Spinner>
            </div>
        );
    }

    // Si erreur, afficher un message d'erreur
    if (error) {
        return (
            <Alert variant="danger" className="my-3">
                {error}
            </Alert>
        );
    }

    // Si aucun événement similaire, ne rien afficher
    if (similarEvents.length === 0) {
        return null;
    }

    // Afficher les événements similaires
    return (
        <div className="recommendation-container">
            <h3 className="recommendation-title">Similar Events</h3>
            <p className="recommendation-subtitle">You might also be interested in these events</p>
            
            <Row xs={1} md={2} lg={3} className="g-4">
                {similarEvents.map((event) => (
                    <Col key={event._id}>
                        <Card className="recommendation-card h-100">
                            {event.image && (
                                <Card.Img 
                                    variant="top" 
                                    src={event.image} 
                                    alt={event.title}
                                    className="recommendation-card-img" 
                                />
                            )}
                            <Card.Body>
                                <Card.Title>{event.title}</Card.Title>
                                <Card.Text className="text-muted">
                                    <i className="bi bi-calendar-event"></i> {formatDate(event.date)}
                                </Card.Text>
                                <Card.Text className="text-muted">
                                    <i className="bi bi-geo-alt"></i> {event.location}
                                </Card.Text>
                                <Card.Text className="recommendation-card-description">
                                    {event.description.length > 100 
                                        ? `${event.description.substring(0, 100)}...` 
                                        : event.description}
                                </Card.Text>
                                <div className="recommendation-score">
                                    <span className="score-label">Similarity Score:</span>
                                    <div className="score-bar">
                                        <div 
                                            className="score-fill" 
                                            style={{ width: `${Math.min(100, event.similarityScore * 20)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </Card.Body>
                            <Card.Footer className="bg-white border-top-0">
                                <Link 
                                    to={`/events/${event._id}`}
                                    onClick={() => recordViewInteraction(event._id)}
                                >
                                    <Button variant="outline-primary" className="w-100">
                                        View Details
                                    </Button>
                                </Link>
                            </Card.Footer>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default SimilarEvents;
