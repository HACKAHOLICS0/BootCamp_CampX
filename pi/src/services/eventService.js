import { mockEvents, mockUsers } from './mockEventData';

class EventService {
    async getAllEvents() {
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            return mockEvents;
        } catch (error) {
            throw new Error('Failed to fetch events');
        }
    }

    async getEvent(id) {
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 300));
            const event = mockEvents.find(e => e._id === id);
            if (!event) {
                throw new Error('Event not found');
            }
            return event;
        } catch (error) {
            throw new Error('Failed to fetch event');
        }
    }

    async createEvent(eventData) {
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 800));
            const newEvent = {
                _id: String(mockEvents.length + 1),
                ...eventData,
                attendees: [],
                createdAt: new Date().toISOString(),
                status: 'upcoming'
            };
            mockEvents.push(newEvent);
            return newEvent;
        } catch (error) {
            throw new Error('Failed to create event');
        }
    }

    async updateEvent(id, eventData) {
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 600));
            const index = mockEvents.findIndex(e => e._id === id);
            if (index === -1) {
                throw new Error('Event not found');
            }
            mockEvents[index] = {
                ...mockEvents[index],
                ...eventData
            };
            return mockEvents[index];
        } catch (error) {
            throw new Error('Failed to update event');
        }
    }

    async deleteEvent(id) {
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 400));
            const index = mockEvents.findIndex(e => e._id === id);
            if (index === -1) {
                throw new Error('Event not found');
            }
            mockEvents.splice(index, 1);
        } catch (error) {
            throw new Error('Failed to delete event');
        }
    }

    async registerForEvent(eventId) {
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            const event = mockEvents.find(e => e._id === eventId);
            if (!event) {
                throw new Error('Event not found');
            }
            if (event.attendees.length >= event.maxAttendees) {
                throw new Error('Event is full');
            }
            // In a real app, you would get the current user's ID from the auth context
            const currentUserId = 'user1'; // This should come from your auth context
            if (event.attendees.includes(currentUserId)) {
                throw new Error('Already registered for this event');
            }
            event.attendees.push(currentUserId);
            return event;
        } catch (error) {
            throw new Error('Failed to register for event');
        }
    }

    async getEventAttendees(eventId) {
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 300));
            const event = mockEvents.find(e => e._id === eventId);
            if (!event) {
                throw new Error('Event not found');
            }
            return event.attendees.map(attendeeId => 
                mockUsers.find(user => user._id === attendeeId)
            );
        } catch (error) {
            throw new Error('Failed to fetch event attendees');
        }
    }
    async getEventStatistics() {
        try {
            // Simule un délai d'API
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Statistiques basées sur les mockEvents
            const now = new Date();
            const activeEvents = mockEvents.filter(event => 
                new Date(event.date) > now
            ).length;

            // Calcul des participants
            const totalAttendees = mockEvents.reduce(
                (sum, event) => sum + event.attendees.length, 0
            );

            // Distribution par catégorie
            const categoryCounts = {};
            mockEvents.forEach(event => {
                categoryCounts[event.category] = 
                    (categoryCounts[event.category] || 0) + 1;
            });

            // Données mockées pour les graphiques
            return {
                totalEvents: mockEvents.length,
                activeEvents,
                totalAttendees: totalAttendees,
                participationRate: Math.round((totalAttendees / (mockEvents.length * 10)) * 100),
                categoryDistribution: Object.keys(categoryCounts).map(category => ({
                    category,
                    count: categoryCounts[category]
                })),
                monthlyAttendance: [
                    { month: 'Jan', count: 12 },
                    { month: 'Fév', count: 18 },
                    { month: 'Mar', count: 15 },
                    { month: 'Avr', count: 20 }
                ],
                topCategories: [
                    { name: 'Technologie', eventCount: 8 },
                    { name: 'Business', eventCount: 5 },
                    { name: 'Art', eventCount: 3 }
                ],
                topEvents: mockEvents
                    .sort((a, b) => b.attendees.length - a.attendees.length)
                    .slice(0, 3)
                    .map(event => ({
                        title: event.title,
                        attendeeCount: event.attendees.length
                    }))
            };
        } catch (error) {
            throw new Error('Failed to generate statistics');
        }
    }
}

export default new EventService();