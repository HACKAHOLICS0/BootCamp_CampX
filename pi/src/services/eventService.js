import axiosInstance from './axiosConfig';

// URL de base pour les fichiers statiques (comme les fichiers ICS)
const API_URL = 'http://localhost:5002/api/events'; // Mise à jour du port

class EventService {

    async getAllEvents() {
        try {
            const response = await axiosInstance.get('/events');
            return response.data;
        } catch (error) {
            console.error('Error fetching events:', error);
            throw new Error('Failed to fetch events');
        }
    }

    async getEvent(id) {
        try {
            const response = await axiosInstance.get(`/events/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching event:', error);
            throw new Error('Failed to fetch event');
        }
    }

    async createEvent(eventData) {
        try {
            // Use FormData if there's an image to upload
            const formData = new FormData();

            // Add all event data to FormData
            Object.keys(eventData).forEach(key => {
                if (key === 'image' && eventData[key] instanceof File) {
                    formData.append(key, eventData[key]);
                } else {
                    formData.append(key, eventData[key]);
                }
            });

            const response = await axiosInstance.post(
                '/events',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error creating event:', error);
            throw new Error(error.response?.data?.message || 'Failed to create event');
        }
    }

    async updateEvent(id, eventData) {
        try {
            // Use FormData if there's an image to upload
            const formData = new FormData();

            // Add all event data to FormData
            Object.keys(eventData).forEach(key => {
                if (key === 'image' && eventData[key] instanceof File) {
                    formData.append(key, eventData[key]);
                } else {
                    formData.append(key, eventData[key]);
                }
            });

            const response = await axiosInstance.put(
                `/events/${id}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error updating event:', error);
            throw new Error(error.response?.data?.message || 'Failed to update event');
        }
    }

    async deleteEvent(id) {
        try {
            await axiosInstance.delete(`/events/${id}`);
        } catch (error) {
            console.error('Error deleting event:', error);
            throw new Error(error.response?.data?.message || 'Failed to delete event');
        }
    }

    async registerForEvent(eventId) {
        try {
            const response = await axiosInstance.post(
                `/events/${eventId}/register`,
                {}
            );
            return response.data;
        } catch (error) {
            console.error('Error registering for event:', error);
            throw new Error(error.response?.data?.message || 'Failed to register for event');
        }
    }

    // Méthodes pour les fonctionnalités de calendrier

    // Obtenir l'URL du fichier iCalendar pour un événement
    getICalendarUrl(eventId) {
        return `${API_URL}/${eventId}/calendar.ics`;
    }

    // Obtenir l'URL Google Calendar pour un événement
    async getGoogleCalendarUrl(eventId) {
        try {
            const response = await axiosInstance.get(`/events/${eventId}/google-calendar`);
            return response.data.url;
        } catch (error) {
            console.error('Error getting Google Calendar URL:', error);
            throw new Error('Failed to get Google Calendar URL');
        }
    }

    // Obtenir l'URL Apple Calendar pour un événement
    async getAppleCalendarUrl(eventId) {
        try {
            const response = await axiosInstance.get(`/events/${eventId}/apple-calendar`);
            return response.data.url;
        } catch (error) {
            console.error('Error getting Apple Calendar URL:', error);
            throw new Error('Failed to get Apple Calendar URL');
        }
    }

    // Ouvrir le fichier iCalendar dans une nouvelle fenêtre
    openICalendarFile(eventId) {
        window.open(this.getICalendarUrl(eventId), '_blank');
    }

    // Ouvrir l'URL Google Calendar dans une nouvelle fenêtre
    async openGoogleCalendar(eventId) {
        try {
            const url = await this.getGoogleCalendarUrl(eventId);
            window.open(url, '_blank');
        } catch (error) {
            console.error('Error opening Google Calendar:', error);
            throw new Error('Failed to open Google Calendar');
        }
    }

    // Ouvrir l'URL Apple Calendar dans une nouvelle fenêtre
    async openAppleCalendar(eventId) {
        try {
            const url = await this.getAppleCalendarUrl(eventId);
            window.open(url, '_blank');
        } catch (error) {
            console.error('Error opening Apple Calendar:', error);
            throw new Error('Failed to open Apple Calendar');
        }
    }

    async getEventAttendees(eventId) {
        try {
            const response = await axiosInstance.get(`/events/${eventId}`);
            return response.data.attendees;
        } catch (error) {
            console.error('Error fetching event attendees:', error);
            throw new Error('Failed to fetch event attendees');
        }
    }
    async getEventStatistics() {
        try {
            // Get all events to calculate statistics
            const events = await this.getAllEvents();

            // Calculate active events
            const now = new Date();
            const activeEvents = events.filter(event =>
                new Date(event.date) > now
            ).length;

            // Calculate total attendees
            const totalAttendees = events.reduce(
                (sum, event) => sum + event.attendees.length, 0
            );

            // Calculate category distribution
            const categoryCounts = {};
            events.forEach(event => {
                categoryCounts[event.category] =
                    (categoryCounts[event.category] || 0) + 1;
            });

            // Calculate monthly attendance (real data)
            const monthlyAttendance = this.calculateMonthlyAttendance(events);

            // Get top events
            const topEvents = [...events]
                .sort((a, b) => b.attendees.length - a.attendees.length)
                .slice(0, 3)
                .map(event => ({
                    title: event.title,
                    attendeeCount: event.attendees.length
                }));

            // Get top categories
            const topCategories = Object.entries(categoryCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([name, eventCount]) => ({ name, eventCount }));

            return {
                totalEvents: events.length,
                activeEvents,
                totalAttendees,
                participationRate: events.length > 0
                    ? Math.round((totalAttendees / (events.length * 10)) * 100)
                    : 0,
                categoryDistribution: Object.keys(categoryCounts).map(category => ({
                    category,
                    count: categoryCounts[category]
                })),
                monthlyAttendance,
                topCategories,
                topEvents
            };
        } catch (error) {
            console.error('Error generating statistics:', error);
            throw new Error('Failed to generate statistics');
        }
    }

    // Helper method to calculate monthly attendance
    calculateMonthlyAttendance(events) {
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        const monthCounts = Array(12).fill(0);

        events.forEach(event => {
            const eventDate = new Date(event.date);
            const month = eventDate.getMonth();
            monthCounts[month] += event.attendees.length;
        });

        return months.map((month, index) => ({
            month,
            count: monthCounts[index]
        }));
    }
}

export default new EventService();