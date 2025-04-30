const calculateEventScore = (event, userPreferences, userHistory) => {
    let score = 0;
    
    // Category match
    if (userPreferences.categories.includes(event.category)) {
        score += 3;
    }

    // Location preference
    if (userPreferences.preferredLocations.includes(event.location)) {
        score += 2;
    }

    // Date preference (favor upcoming events)
    const eventDate = new Date(event.date);
    const now = new Date();
    const daysUntilEvent = (eventDate - now) / (1000 * 60 * 60 * 24);
    if (daysUntilEvent > 0 && daysUntilEvent < 30) {
        score += 2;
    }

    // Attendance availability
    const availableSpots = event.maxAttendees - event.attendees.length;
    if (availableSpots > 0) {
        score += 1;
    }

    // Similar to past attended events
    const hasAttendedSimilar = userHistory.some(
        pastEvent => pastEvent.category === event.category
    );
    if (hasAttendedSimilar) {
        score += 2;
    }

    return score;
};

const recommendEvents = (events, userPreferences, userHistory) => {
    const scoredEvents = events.map(event => ({
        ...event,
        score: calculateEventScore(event, userPreferences, userHistory)
    }));

    return scoredEvents.sort((a, b) => b.score - a.score);
};

export default {
    recommendEvents
};
