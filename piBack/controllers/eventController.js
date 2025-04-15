const Event = require('../model/Event');
const { uploadImage } = require('../utils/uploadImage');

// Create a new event
exports.createEvent = async (req, res) => {
    try {
        console.log('Received event data:', req.body);
        console.log('Received file:', req.file);
        
        const eventData = {
            ...req.body,
            organizer: req.user._id,
            date: new Date(req.body.date)
        };

        if (req.file) {
            try {
                const imageUrl = await uploadImage(req.file);
                eventData.image = imageUrl;
            } catch (uploadError) {
                console.error('Image upload error:', uploadError);
                return res.status(400).json({ message: 'Failed to upload image' });
            }
        }

        console.log('Processed event data:', eventData);

        const event = new Event(eventData);
        await event.save();
        res.status(201).json(event);
    } catch (error) {
        console.error('Event creation error:', error);
        res.status(400).json({ 
            message: error.message,
            details: error.errors ? Object.values(error.errors).map(err => err.message) : []
        });
    }
};

// Get all events
exports.getAllEvents = async (req, res) => {
    try {
        console.log('Fetching all events');
        const events = await Event.find()
            .populate('organizer', 'name email')
            .populate('attendees', 'name email');
        console.log('Found events:', events.length);
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get a single event
exports.getEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'name email')
            .populate('attendees', 'name email');
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update an event
exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if user is the organizer
        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this event' });
        }

        if (req.file) {
            const imageUrl = await uploadImage(req.file);
            req.body.image = imageUrl;
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );
        res.json(updatedEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if user is the organizer
        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this event' });
        }

        await event.remove();
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Register for an event
exports.registerForEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if event is full
        if (event.attendees.length >= event.maxAttendees) {
            return res.status(400).json({ message: 'Event is full' });
        }

        // Check if user is already registered
        if (event.attendees.includes(req.user._id)) {
            return res.status(400).json({ message: 'Already registered for this event' });
        }

        event.attendees.push(req.user._id);
        await event.save();
        res.json(event);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}; 