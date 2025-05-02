const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const eventController = require('../controllers/eventController');
const userAuth = require('../middleware/userAuth');
const adminAuth = require('../middleware/adminAuth');
const upload = require('../middleware/upload');

// Routes publiques
// Get all events (filtre automatiquement les événements non approuvés pour les utilisateurs non admin)
router.get('/', eventController.getAllEvents);

// Route de test pour vérifier l'authentification admin
router.get('/admin/check-auth', adminAuth, (req, res) => {
    res.json({
        message: 'Admin authentication successful',
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            typeUser: req.user.typeUser
        }
    });
});

// Routes pour administrateurs
// Get pending events (admin only)
router.get('/admin/pending', adminAuth, eventController.getPendingEvents);

// Get a single event
router.get('/:id', eventController.getEvent);

// Routes pour utilisateurs authentifiés
// Create a new event (protected route)
router.post('/', userAuth, upload.single('image'), eventController.createEvent);

// Update an event (protected route)
router.put('/:id', userAuth, upload.single('image'), eventController.updateEvent);

// Delete an event (protected route)
router.delete('/:id', userAuth, eventController.deleteEvent);

// Register for an event (protected route)
router.post('/:id/register', userAuth, eventController.registerForEvent);

// Get iCalendar file for an event
router.get('/:id/calendar.ics', eventController.getEventCalendar);

// Get Google Calendar URL for an event
router.get('/:id/google-calendar', eventController.getGoogleCalendarUrl);

// Get Apple Calendar URL for an event
router.get('/:id/apple-calendar', eventController.getAppleCalendarUrl);

// Route de test pour approuver un événement spécifique (admin only)
router.get('/admin/test-approve/:id', adminAuth, async (req, res) => {
    try {
        console.log('Test approving event with ID:', req.params.id);

        // Vérifier si l'ID est valide
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid event ID format' });
        }

        const Event = require('../Model/Event');
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        return res.json({
            message: 'Event found and can be approved',
            event: {
                id: event._id,
                title: event.title,
                isApproved: event.isApproved,
                organizer: event.organizer
            }
        });
    } catch (error) {
        console.error('Error in test-approve route:', error);
        return res.status(500).json({ message: error.message });
    }
});

// Approve an event (admin only)
router.post('/:id/approve', adminAuth, eventController.approveEvent);

// Route de test pour rejeter un événement spécifique (admin only)
router.get('/admin/test-reject/:id', adminAuth, async (req, res) => {
    try {
        console.log('Test rejecting event with ID:', req.params.id);

        // Vérifier si l'ID est valide
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid event ID format' });
        }

        const Event = require('../Model/Event');
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        return res.json({
            message: 'Event found and can be rejected',
            event: {
                id: event._id,
                title: event.title,
                isApproved: event.isApproved,
                organizer: event.organizer
            }
        });
    } catch (error) {
        console.error('Error in test-reject route:', error);
        return res.status(500).json({ message: error.message });
    }
});

// Reject an event (admin only)
router.post('/:id/reject', adminAuth, eventController.rejectEvent);

module.exports = router;