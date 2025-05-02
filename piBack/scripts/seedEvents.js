const mongoose = require('mongoose');
const Event = require('../Model/Event');
const User = require('../Model/User');
require('dotenv').config();

// Mock event data to seed into MongoDB
const mockEvents = [
    {
        title: 'Web Development Workshop',
        description: 'Learn the basics of web development with HTML, CSS, and JavaScript.',
        date: '2024-04-15T10:00:00Z',
        location: 'Tech Hub, Room 101',
        maxAttendees: 30,
        category: 'workshop',
        image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
        status: 'upcoming'
    },
    {
        title: 'AI Conference 2024',
        description: 'Annual conference on artificial intelligence and machine learning.',
        date: '2024-05-20T09:00:00Z',
        location: 'Convention Center, Hall A',
        maxAttendees: 200,
        category: 'conference',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
        status: 'upcoming'
    },
    {
        title: 'Startup Meetup',
        description: 'Networking event for entrepreneurs and startup enthusiasts.',
        date: '2024-04-05T18:00:00Z',
        location: 'Innovation Space, Floor 3',
        maxAttendees: 50,
        category: 'meetup',
        image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4',
        status: 'upcoming'
    },
    {
        title: 'Hackathon 2024',
        description: '48-hour coding competition for developers of all levels.',
        date: '2024-06-01T12:00:00Z',
        location: 'University Campus, Building C',
        maxAttendees: 100,
        category: 'hackathon',
        image: 'https://images.unsplash.com/photo-1551434678-e076c223a692',
        status: 'upcoming'
    },
    {
        title: 'Mobile App Development Workshop',
        description: 'Hands-on workshop for building mobile applications.',
        date: '2024-04-25T14:00:00Z',
        location: 'Tech Lab, Room 203',
        maxAttendees: 25,
        category: 'workshop',
        image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c',
        status: 'upcoming'
    }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        
        try {
            // Find an admin user to set as organizer
            const adminUser = await User.findOne({ typeUser: 'admin' });
            
            if (!adminUser) {
                console.error('No admin user found. Please create an admin user first.');
                process.exit(1);
            }
            
            // Delete existing events (optional - comment out if you want to keep existing events)
            await Event.deleteMany({});
            console.log('Cleared existing events');
            
            // Add organizer to each event
            const eventsWithOrganizer = mockEvents.map(event => ({
                ...event,
                organizer: adminUser._id,
                attendees: [] // Start with empty attendees
            }));
            
            // Insert events
            const result = await Event.insertMany(eventsWithOrganizer);
            console.log(`Successfully seeded ${result.length} events`);
            
            // Close the connection
            mongoose.connection.close();
            console.log('Database connection closed');
        } catch (error) {
            console.error('Error seeding events:', error);
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
