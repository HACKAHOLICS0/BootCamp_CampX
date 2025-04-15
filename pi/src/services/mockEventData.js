const mockEvents = [
    {
        _id: '1',
        title: 'Web Development Workshop',
        description: 'Learn the basics of web development with HTML, CSS, and JavaScript.',
        date: '2024-04-15T10:00:00Z',
        location: 'Tech Hub, Room 101',
        maxAttendees: 30,
        category: 'workshop',
        image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
        status: 'upcoming',
        organizer: 'user1',
        attendees: ['user2', 'user3'],
        createdAt: '2024-03-01T09:00:00Z'
    },
    {
        _id: '2',
        title: 'AI Conference 2024',
        description: 'Annual conference on artificial intelligence and machine learning.',
        date: '2024-05-20T09:00:00Z',
        location: 'Convention Center, Hall A',
        maxAttendees: 200,
        category: 'conference',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
        status: 'upcoming',
        organizer: 'user2',
        attendees: ['user1', 'user3', 'user4'],
        createdAt: '2024-02-15T10:00:00Z'
    },
    {
        _id: '3',
        title: 'Startup Meetup',
        description: 'Networking event for entrepreneurs and startup enthusiasts.',
        date: '2024-04-05T18:00:00Z',
        location: 'Innovation Space, Floor 3',
        maxAttendees: 50,
        category: 'meetup',
        image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4',
        status: 'upcoming',
        organizer: 'user3',
        attendees: ['user1', 'user2'],
        createdAt: '2024-03-10T14:00:00Z'
    },
    {
        _id: '4',
        title: 'Hackathon 2024',
        description: '48-hour coding competition for developers of all levels.',
        date: '2024-06-01T12:00:00Z',
        location: 'University Campus, Building C',
        maxAttendees: 100,
        category: 'hackathon',
        image: 'https://images.unsplash.com/photo-1551434678-e076c223a692',
        status: 'upcoming',
        organizer: 'user4',
        attendees: ['user1', 'user2', 'user3'],
        createdAt: '2024-02-20T11:00:00Z'
    },
    {
        _id: '5',
        title: 'Mobile App Development Workshop',
        description: 'Hands-on workshop for building mobile applications.',
        date: '2024-04-25T14:00:00Z',
        location: 'Tech Lab, Room 203',
        maxAttendees: 25,
        category: 'workshop',
        image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c',
        status: 'upcoming',
        organizer: 'user5',
        attendees: ['user1', 'user2'],
        createdAt: '2024-03-05T15:00:00Z'
    }
];

const mockUsers = [
    {
        _id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user'
    },
    {
        _id: 'user2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'user'
    },
    {
        _id: 'user3',
        name: 'Mike Johnson',
        email: 'mike@example.com',
        role: 'user'
    },
    {
        _id: 'user4',
        name: 'Sarah Wilson',
        email: 'sarah@example.com',
        role: 'admin'
    },
    {
        _id: 'user5',
        name: 'David Brown',
        email: 'david@example.com',
        role: 'user'
    }
];

export { mockEvents, mockUsers }; 