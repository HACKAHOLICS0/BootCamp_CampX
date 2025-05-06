import React from 'react';
import { Alert, Card } from 'react-bootstrap';
import './EventLocationMap.css';

const EventLocationMap = ({ location, isOnlineEvent }) => {
  // Si c'est un événement en ligne, afficher un message spécifique
  if (isOnlineEvent) {
    return (
      <div className="online-event-info">
        <Alert variant="info">
          <i className="bi bi-laptop"></i> This is an online event
          <p className="mb-0 mt-2">
            <strong>Location:</strong> {location}
          </p>
        </Alert>
      </div>
    );
  }

  // Pour les événements en présentiel, afficher une carte statique
  // Nous utilisons OpenStreetMap qui ne nécessite pas de clé API
  const encodedLocation = encodeURIComponent(location);
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=-180%2C-90%2C180%2C90&layer=mapnik&marker=0%2C0&query=${encodedLocation}`;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;

  return (
    <div className="event-location-map">
      <div className="map-container">
        <iframe
          title="Event Location"
          width="100%"
          height="300"
          frameBorder="0"
          scrolling="no"
          marginHeight="0"
          marginWidth="0"
          src={mapUrl}
          style={{ borderRadius: '8px', border: '1px solid #ddd' }}
        ></iframe>
      </div>

      <div className="location-details mt-3">
        <p className="location-text mb-2">
          <strong>Address:</strong> {location}
        </p>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm btn-outline-primary"
        >
          <i className="bi bi-geo-alt"></i> Get Directions
        </a>
      </div>
    </div>
  );
};

export default EventLocationMap;
