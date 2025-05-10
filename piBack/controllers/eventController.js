const Event = require('../Model/Event'); // Corriger le chemin du modèle
const { uploadImage } = require('../utils/uploadImage');

// Create a new event
exports.createEvent = async (req, res) => {
    try {
        console.log('Received event data:', req.body);
        console.log('Received file:', req.file);
        console.log('User:', req.user);

        // Vérifier si l'utilisateur est authentifié
        if (!req.user || !req.user._id) {
            console.error('User not authenticated or missing ID');
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Vérifier les champs obligatoires
        const requiredFields = ['title', 'description', 'date', 'location', 'maxAttendees', 'category'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            console.error('Missing required fields:', missingFields);
            return res.status(400).json({
                message: 'Missing required fields',
                missingFields
            });
        }

        // Préparer les données de l'événement
        const eventData = {
            ...req.body,
            organizer: req.user._id,
            date: new Date(req.body.date),
            isApproved: false, // Par défaut, l'événement n'est pas approuvé
            maxAttendees: parseInt(req.body.maxAttendees) // S'assurer que maxAttendees est un nombre
        };

        // Vérifier si le statut est valide, sinon utiliser la valeur par défaut
        if (req.body.status && !['upcoming', 'ongoing', 'completed', 'cancelled', 'pending'].includes(req.body.status)) {
            eventData.status = 'upcoming'; // Valeur par défaut si le statut n'est pas valide
        }

        // Traiter l'image si elle existe
        if (req.file) {
            try {
                console.log('Processing image file...');
                const imageUrl = await uploadImage(req.file);
                // Normaliser le chemin avec des forward slashes
                eventData.image = imageUrl.replace(/\\/g, "/");
                console.log('Image URL:', eventData.image);
            } catch (uploadError) {
                console.error('Image upload error:', uploadError);
                return res.status(400).json({ message: 'Failed to upload image', error: uploadError.message });
            }
        }

        console.log('Processed event data:', eventData);

        // Créer et sauvegarder l'événement
        try {
            const event = new Event(eventData);
            const savedEvent = await event.save();
            console.log('Event saved successfully:', savedEvent._id);

            // Récupérer l'événement avec les références peuplées
            const populatedEvent = await Event.findById(savedEvent._id)
                .populate('organizer', 'name email');

            res.status(201).json({
                event: populatedEvent,
                message: 'Event created successfully and is pending approval'
            });
        } catch (saveError) {
            console.error('Error saving event to database:', saveError);
            return res.status(500).json({
                message: 'Failed to save event to database',
                error: saveError.message,
                details: saveError.errors ? Object.values(saveError.errors).map(err => err.message) : []
            });
        }
    } catch (error) {
        console.error('Event creation error:', error);
        res.status(500).json({
            message: 'An unexpected error occurred while creating the event',
            error: error.message,
            details: error.errors ? Object.values(error.errors).map(err => err.message) : []
        });
    }
};

// Get all events
exports.getAllEvents = async (req, res) => {
    try {
        console.log('Fetching all events');

        // Déterminer si l'utilisateur est un administrateur
        const isAdmin = req.user && req.user.typeUser === 'admin';

        // Construire la requête en fonction du type d'utilisateur
        let query = {};

        // Si l'utilisateur n'est pas un administrateur, ne montrer que les événements approuvés
        // ou les événements dont l'utilisateur est l'organisateur
        if (!isAdmin && req.user) {
            query = {
                $or: [
                    { isApproved: true },
                    { organizer: req.user._id }
                ]
            };
        } else if (!isAdmin) {
            // Pour les utilisateurs non connectés, ne montrer que les événements approuvés
            query = { isApproved: true };
        }

        const events = await Event.find(query)
            .populate('organizer', 'name email')
            .populate('attendees', 'name email')
            .populate('approvedBy', 'name email');

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
            .populate('attendees', 'name email')
            .populate('approvedBy', 'name email');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Vérifier si l'utilisateur a le droit de voir cet événement
        const isAdmin = req.user && req.user.typeUser === 'admin';
        const isOrganizer = req.user && event.organizer._id.toString() === req.user._id.toString();

        // Si l'événement n'est pas approuvé et que l'utilisateur n'est ni admin ni l'organisateur
        if (!event.isApproved && !isAdmin && !isOrganizer) {
            return res.status(403).json({
                message: 'This event is pending approval and can only be viewed by the organizer or administrators'
            });
        }

        res.json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
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

        // Si l'événement est déjà approuvé, empêcher les modifications majeures
        const updateData = { ...req.body, updatedAt: Date.now() };

        if (event.isApproved) {
            // Empêcher la modification de certains champs importants si l'événement est approuvé
            delete updateData.date;
            delete updateData.location;
            delete updateData.maxAttendees;
            delete updateData.category;

            // Réinitialiser le statut d'approbation si des modifications importantes sont tentées
            if (req.body.date || req.body.location || req.body.maxAttendees || req.body.category) {
                updateData.isApproved = false;
                updateData.approvedBy = null;
                updateData.approvedAt = null;
                updateData.rejectionReason = null;
            }
        }

        if (req.file) {
            try {
                const imageUrl = await uploadImage(req.file);
                // Normaliser le chemin avec des forward slashes
                updateData.image = imageUrl.replace(/\\/g, "/");
                console.log('Updated image URL:', updateData.image);
            } catch (uploadError) {
                console.error('Image upload error:', uploadError);
                return res.status(400).json({ message: 'Failed to upload image', error: uploadError.message });
            }
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('organizer', 'name email');

        // Message personnalisé si l'événement a perdu son approbation
        let message = 'Event updated successfully';
        if (event.isApproved && !updatedEvent.isApproved) {
            message = 'Event updated successfully but requires re-approval due to significant changes';
        }

        res.json({
            event: updatedEvent,
            message: message
        });
    } catch (error) {
        console.error('Event update error:', error);
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

        // Check if user is the organizer or an admin
        if (event.organizer.toString() !== req.user._id.toString() && req.user.typeUser !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this event' });
        }

        // Use findByIdAndDelete instead of remove() which is deprecated
        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Register for an event
exports.registerForEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'name email');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Vérifier si l'événement est approuvé
        if (!event.isApproved) {
            return res.status(400).json({ message: 'Cannot register for an unapproved event' });
        }

        // Check if event is full
        if (event.attendees.length >= event.maxAttendees) {
            return res.status(400).json({ message: 'Event is full' });
        }

        // Check if user is already registered
        if (event.attendees.includes(req.user._id)) {
            return res.status(400).json({ message: 'Already registered for this event' });
        }

        // Ajouter l'utilisateur à la liste des participants
        event.attendees.push(req.user._id);
        await event.save();

        // Générer les URLs pour les calendriers
        const calendarLinks = {
            ics: `${req.protocol}://${req.get('host')}/api/events/${event._id}/calendar.ics`,
            google: eventUtils.generateGoogleCalendarUrl(event),
            apple: `${req.protocol}://${req.get('host')}/api/events/${event._id}/apple-calendar`
        };

        // Générer un QR code pour l'événement
        console.log('Génération du QR code pour l\'événement:', event._id);
        console.log('URL de base:', `${req.protocol}://${req.get('host')}`);

        let qrCodeUrl;
        try {
            qrCodeUrl = await eventUtils.generateQRCode(event, `${req.protocol}://${req.get('host')}`);
            console.log('QR code généré avec succès:', qrCodeUrl);
        } catch (qrError) {
            console.error('Erreur lors de la génération du QR code:', qrError);
            qrCodeUrl = null;
        }

        // Retourner l'événement avec les liens de calendrier et le QR code
        // Construire l'URL complète du QR code
        const fullQrCodeUrl = qrCodeUrl ? `${req.protocol}://${req.get('host')}${qrCodeUrl}` : null;
        console.log('Full QR code URL:', fullQrCodeUrl);

        res.json({
            event,
            calendarLinks,
            qrCodeUrl: fullQrCodeUrl,
            message: 'Successfully registered for the event. You can add this event to your calendar using the provided links.'
        });
    } catch (error) {
        console.error('Error registering for event:', error);
        res.status(400).json({ message: error.message });
    }
};

// Approve an event (admin only)
exports.approveEvent = async (req, res) => {
    try {
        console.log('Approving event with ID:', req.params.id);
        console.log('Admin user:', req.user.name);
        console.log('Admin user ID:', req.user._id);
        console.log('Admin user type:', req.user.typeUser);

        let event;
        try {
            event = await Event.findById(req.params.id);
            console.log('Event found:', !!event);
        } catch (findError) {
            console.error('Error finding event:', findError);
            return res.status(404).json({ message: 'Invalid event ID format or event not found' });
        }

        if (!event) {
            console.log('Event not found with ID:', req.params.id);
            return res.status(404).json({ message: 'Event not found' });
        }

        console.log('Event current approval status:', event.isApproved);

        // Vérifier si l'événement est déjà approuvé
        if (event.isApproved) {
            console.log('Event is already approved');
            return res.status(400).json({ message: 'Event is already approved' });
        }

        // Mettre à jour l'événement
        event.isApproved = true;
        event.approvedBy = req.user._id;
        event.approvedAt = new Date();
        event.rejectionReason = null; // Effacer toute raison de rejet précédente

        // Si le statut est "pending", le changer en "upcoming"
        if (event.status === 'pending') {
            event.status = 'upcoming';
        }

        console.log('Saving updated event...');

        try {
            await event.save();
            console.log('Event saved successfully');
        } catch (saveError) {
            console.error('Error saving event:', saveError);
            return res.status(500).json({ message: 'Error saving event: ' + saveError.message });
        }

        // Retourner l'événement mis à jour
        let updatedEvent;
        try {
            updatedEvent = await Event.findById(req.params.id)
                .populate('organizer', 'name email')
                .populate('approvedBy', 'name email');

            console.log('Updated event retrieved successfully');
        } catch (retrieveError) {
            console.error('Error retrieving updated event:', retrieveError);
            // Continuer malgré l'erreur, car l'événement a déjà été mis à jour
            return res.json({ message: 'Event approved successfully, but could not retrieve updated details' });
        }

        res.json(updatedEvent);
    } catch (error) {
        console.error('Error approving event:', error);
        res.status(500).json({ message: error.message });
    }
};

// Reject an event (admin only)
exports.rejectEvent = async (req, res) => {
    try {
        console.log('Rejecting event with ID:', req.params.id);
        console.log('Admin user:', req.user.name);
        console.log('Admin user ID:', req.user._id);
        console.log('Admin user type:', req.user.typeUser);
        console.log('Request body:', req.body);

        const { reason } = req.body;

        if (!reason) {
            console.log('Rejection reason is missing');
            return res.status(400).json({ message: 'Rejection reason is required' });
        }

        console.log('Rejection reason:', reason);

        let event;
        try {
            event = await Event.findById(req.params.id);
            console.log('Event found:', !!event);
        } catch (findError) {
            console.error('Error finding event:', findError);
            return res.status(404).json({ message: 'Invalid event ID format or event not found' });
        }

        if (!event) {
            console.log('Event not found with ID:', req.params.id);
            return res.status(404).json({ message: 'Event not found' });
        }

        // Mettre à jour l'événement
        event.isApproved = false;
        event.rejectionReason = reason;
        event.approvedBy = null;
        event.approvedAt = null;

        // Si le statut est "upcoming" et que l'événement n'a jamais été approuvé, le remettre à "pending"
        if (event.status === 'upcoming' && !event.approvedAt) {
            event.status = 'pending';
        }

        console.log('Saving updated event with rejection...');

        try {
            await event.save();
            console.log('Event saved successfully with rejection');
        } catch (saveError) {
            console.error('Error saving event with rejection:', saveError);
            return res.status(500).json({ message: 'Error saving event: ' + saveError.message });
        }

        // Retourner l'événement mis à jour
        let updatedEvent;
        try {
            updatedEvent = await Event.findById(req.params.id)
                .populate('organizer', 'name email');

            console.log('Updated event retrieved successfully after rejection');
        } catch (retrieveError) {
            console.error('Error retrieving updated event after rejection:', retrieveError);
            // Continuer malgré l'erreur, car l'événement a déjà été mis à jour
            return res.json({ message: 'Event rejected successfully, but could not retrieve updated details' });
        }

        res.json(updatedEvent);
    } catch (error) {
        console.error('Error rejecting event:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get pending events (admin only)
exports.getPendingEvents = async (req, res) => {
    try {
        console.log('Getting pending events for admin user:', req.user.name);
        console.log('Admin user ID:', req.user._id);
        console.log('Admin user type:', req.user.typeUser);

        // Vérifier s'il y a des événements en attente
        const count = await Event.countDocuments({ isApproved: false });
        console.log('Number of pending events found:', count);

        const events = await Event.find({ isApproved: false })
            .populate('organizer', 'name email');

        console.log('Pending events retrieved successfully');

        // Retourner un tableau vide si aucun événement n'est trouvé
        res.json(events || []);
    } catch (error) {
        console.error('Error fetching pending events:', error);
        res.status(500).json({ message: error.message });
    }
};

// Importer les utilitaires d'événements
const eventUtils = require('../utils/eventUtils');

// Générer et retourner un fichier iCalendar pour un événement
exports.getEventCalendar = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'name email');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Vérifier si l'événement est approuvé
        if (!event.isApproved) {
            return res.status(400).json({ message: 'Cannot get calendar for an unapproved event' });
        }

        // Générer le fichier iCalendar
        const icsContent = eventUtils.generateICalendar(event);

        if (!icsContent) {
            return res.status(500).json({ message: 'Failed to generate iCalendar file' });
        }

        // Définir les en-têtes pour le téléchargement du fichier
        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', `attachment; filename="event_${event._id}.ics"`);

        // Envoyer le contenu du fichier
        res.send(icsContent);
    } catch (error) {
        console.error('Error generating event calendar:', error);
        res.status(500).json({ message: error.message });
    }
};

// Générer et retourner une URL Google Calendar pour un événement
exports.getGoogleCalendarUrl = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'name email');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Vérifier si l'événement est approuvé
        if (!event.isApproved) {
            return res.status(400).json({ message: 'Cannot get calendar for an unapproved event' });
        }

        // Générer l'URL Google Calendar
        const googleCalendarUrl = eventUtils.generateGoogleCalendarUrl(event);

        if (!googleCalendarUrl) {
            return res.status(500).json({ message: 'Failed to generate Google Calendar URL' });
        }

        // Retourner l'URL
        res.json({ url: googleCalendarUrl });
    } catch (error) {
        console.error('Error generating Google Calendar URL:', error);
        res.status(500).json({ message: error.message });
    }
};

// Générer et retourner une URL Apple Calendar pour un événement
exports.getAppleCalendarUrl = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'name email');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Vérifier si l'événement est approuvé
        if (!event.isApproved) {
            return res.status(400).json({ message: 'Cannot get calendar for an unapproved event' });
        }

        // Générer l'URL Apple Calendar
        const appleCalendarUrl = eventUtils.generateAppleCalendarUrl(event);

        if (!appleCalendarUrl) {
            return res.status(500).json({ message: 'Failed to generate Apple Calendar URL' });
        }

        // Retourner l'URL
        res.json({ url: `${req.protocol}://${req.get('host')}${appleCalendarUrl}` });
    } catch (error) {
        console.error('Error generating Apple Calendar URL:', error);
        res.status(500).json({ message: error.message });
    }
};
