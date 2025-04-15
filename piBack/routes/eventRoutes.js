const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get all events
router.get('/', eventController.getAllEvents);

// Get a single event
router.get('/:id', eventController.getEvent);

// Create a new event (protected route)
router.post('/', auth, upload.single('image'), eventController.createEvent);

// Update an event (protected route)
router.put('/:id', auth, upload.single('image'), eventController.updateEvent);

// Delete an event (protected route)
router.delete('/:id', auth, eventController.deleteEvent);

// Register for an event (protected route)
router.post('/:id/register', auth, eventController.registerForEvent);

module.exports = router; 