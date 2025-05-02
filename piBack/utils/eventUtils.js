const QRCode = require('qrcode');
const ical = require('ical-generator');
const fs = require('fs');
const path = require('path');

// Assurez-vous que le dossier existe
const qrCodeDir = path.join(__dirname, '../public/qrcodes');
if (!fs.existsSync(qrCodeDir)) {
    fs.mkdirSync(qrCodeDir, { recursive: true });
}

/**
 * Génère un QR code pour un événement
 * @param {Object} event - L'événement pour lequel générer un QR code
 * @param {string} baseUrl - L'URL de base du frontend
 * @returns {Promise<string>} - L'URL du QR code généré
 */
exports.generateQRCode = async (event, baseUrl = 'http://localhost:3000') => {
    try {
        // Créer l'URL de l'événement
        const eventUrl = `${baseUrl}/events/${event._id}`;

        // Nom du fichier QR code
        const fileName = `event_${event._id}.png`;
        const filePath = path.join(qrCodeDir, fileName);

        // Générer le QR code
        await QRCode.toFile(filePath, eventUrl, {
            color: {
                dark: '#000',  // Points
                light: '#FFF' // Arrière-plan
            },
            width: 300,
            margin: 1
        });

        // Retourner l'URL relative du QR code
        return `/qrcodes/${fileName}`;
    } catch (error) {
        console.error('Erreur lors de la génération du QR code:', error);
        throw error;
    }
};

/**
 * Génère un fichier iCalendar pour un événement
 * @param {Object} event - L'événement pour lequel générer un fichier iCalendar
 * @returns {Buffer} - Le contenu du fichier iCalendar
 */
exports.generateICalendar = (event) => {
    try {
        const cal = ical({
            domain: 'campx.com',
            name: 'CampX Events'
        });

        // Ajouter l'événement au calendrier
        cal.createEvent({
            start: new Date(event.date),
            end: new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000), // Ajouter 2 heures par défaut
            summary: event.title,
            description: event.description,
            location: event.location,
            url: event.eventUrl,
            organizer: {
                name: event.organizer.name,
                email: event.organizer.email
            }
        });

        // Retourner le contenu du fichier iCalendar
        return cal.toString();
    } catch (error) {
        console.error('Erreur lors de la génération du fichier iCalendar:', error);
        throw error;
    }
};

/**
 * Génère une URL Google Calendar pour un événement
 * @param {Object} event - L'événement pour lequel générer une URL Google Calendar
 * @returns {string} - L'URL Google Calendar
 */
exports.generateGoogleCalendarUrl = (event) => {
    try {
        const eventDate = new Date(event.date);
        const endDate = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // Ajouter 2 heures par défaut

        // Formater les dates pour Google Calendar (format ISO sans les caractères spéciaux)
        const startDate = eventDate.toISOString().replace(/-|:|\.\d+/g, '');
        const endDateStr = endDate.toISOString().replace(/-|:|\.\d+/g, '');

        // Construire l'URL Google Calendar
        const url = new URL('https://www.google.com/calendar/render');
        url.searchParams.append('action', 'TEMPLATE');
        url.searchParams.append('text', event.title);
        url.searchParams.append('dates', `${startDate}/${endDateStr}`);
        url.searchParams.append('details', event.description);
        url.searchParams.append('location', event.location);

        return url.toString();
    } catch (error) {
        console.error('Erreur lors de la génération de l\'URL Google Calendar:', error);
        return null;
    }
};

/**
 * Génère une URL Apple Calendar pour un événement
 * @param {Object} event - L'événement pour lequel générer une URL Apple Calendar
 * @returns {string} - L'URL Apple Calendar
 */
exports.generateAppleCalendarUrl = (event) => {
    try {
        // Pour Apple Calendar, nous utilisons le même format que pour iCalendar
        // mais avec le protocole webcal:// au lieu de http://
        const icsContent = this.generateICalendar(event);

        // Nous devons d'abord sauvegarder le fichier ICS quelque part
        const fileName = `event_${event._id}.ics`;
        const filePath = path.join(__dirname, '../public/ics', fileName);

        // Assurez-vous que le dossier existe
        const icsDir = path.join(__dirname, '../public/ics');
        if (!fs.existsSync(icsDir)) {
            fs.mkdirSync(icsDir, { recursive: true });
        }

        // Écrire le fichier ICS
        fs.writeFileSync(filePath, icsContent);

        // Retourner l'URL du fichier ICS
        return `/ics/${fileName}`;
    } catch (error) {
        console.error('Erreur lors de la génération de l\'URL Apple Calendar:', error);
        return null;
    }
};
