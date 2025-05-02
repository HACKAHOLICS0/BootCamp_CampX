const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../Model/User');
const Event = require('../Model/Event');
const UserEventPreference = require('../Model/UserEventPreference');
require('dotenv').config({ path: './config/.env' });

// Catégories d'événements
const EVENT_CATEGORIES = [
    'workshop', 'conference', 'hackathon', 'networking', 'seminar', 
    'webinar', 'training', 'meetup', 'competition', 'social'
];

// Lieux d'événements
const EVENT_LOCATIONS = [
    'Esprit Campus', 'Tech Hub', 'Innovation Center', 'Digital Lab',
    'Startup Space', 'Coworking Zone', 'Virtual Meeting', 'Conference Center',
    'University Hall', 'Community Center'
];

// Fonction pour générer un mot de passe haché
const generateHashedPassword = async () => {
    return await bcrypt.hash('password123', 10);
};

// Fonction pour générer un utilisateur aléatoire
const generateRandomUser = async (index) => {
    const hashedPassword = await generateHashedPassword();
    return {
        name: `User${index}`,
        lastName: `LastName${index}`,
        email: `user${index}@example.com`,
        password: hashedPassword,
        typeUser: 'user',
        isVerified: true
    };
};

// Fonction pour générer un événement aléatoire
const generateRandomEvent = (organizerId, index) => {
    // Date aléatoire entre aujourd'hui et 3 mois dans le futur
    const randomFutureDays = Math.floor(Math.random() * 90);
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + randomFutureDays);
    
    // Catégorie aléatoire
    const randomCategory = EVENT_CATEGORIES[Math.floor(Math.random() * EVENT_CATEGORIES.length)];
    
    // Lieu aléatoire
    const randomLocation = EVENT_LOCATIONS[Math.floor(Math.random() * EVENT_LOCATIONS.length)];
    
    return {
        title: `${randomCategory.charAt(0).toUpperCase() + randomCategory.slice(1)} Event ${index}`,
        description: `This is a ${randomCategory} event organized at ${randomLocation}. Join us for an amazing experience!`,
        date: eventDate,
        location: randomLocation,
        organizer: organizerId,
        maxAttendees: 20 + Math.floor(Math.random() * 80), // Entre 20 et 100 participants max
        category: randomCategory,
        status: 'upcoming',
        isApproved: true,
        attendees: []
    };
};

// Fonction pour générer des préférences utilisateur aléatoires
const generateRandomUserPreferences = (userId, events) => {
    // Sélectionner des catégories aléatoires avec des poids
    const categoryPreferences = [];
    const usedCategories = new Set();
    
    // Choisir entre 2 et 5 catégories préférées
    const numCategories = 2 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < numCategories; i++) {
        let category;
        do {
            category = EVENT_CATEGORIES[Math.floor(Math.random() * EVENT_CATEGORIES.length)];
        } while (usedCategories.has(category));
        
        usedCategories.add(category);
        
        categoryPreferences.push({
            category,
            weight: 1 + Math.random() * 4 // Poids entre 1 et 5
        });
    }
    
    // Sélectionner des lieux aléatoires avec des poids
    const locationPreferences = [];
    const usedLocations = new Set();
    
    // Choisir entre 1 et 3 lieux préférés
    const numLocations = 1 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numLocations; i++) {
        let location;
        do {
            location = EVENT_LOCATIONS[Math.floor(Math.random() * EVENT_LOCATIONS.length)];
        } while (usedLocations.has(location));
        
        usedLocations.add(location);
        
        locationPreferences.push({
            location,
            weight: 1 + Math.random() * 4 // Poids entre 1 et 5
        });
    }
    
    // Sélectionner des jours préférés aléatoires
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const preferredDays = [];
    const numDays = 1 + Math.floor(Math.random() * 7); // Entre 1 et 7 jours
    
    for (let i = 0; i < numDays; i++) {
        const randomDay = days[Math.floor(Math.random() * days.length)];
        if (!preferredDays.includes(randomDay)) {
            preferredDays.push(randomDay);
        }
    }
    
    // Sélectionner des moments de la journée préférés aléatoires
    const timeOfDay = ['morning', 'afternoon', 'evening'];
    const preferredTimeOfDay = [];
    const numTimes = 1 + Math.floor(Math.random() * 3); // Entre 1 et 3 moments
    
    for (let i = 0; i < numTimes; i++) {
        const randomTime = timeOfDay[Math.floor(Math.random() * timeOfDay.length)];
        if (!preferredTimeOfDay.includes(randomTime)) {
            preferredTimeOfDay.push(randomTime);
        }
    }
    
    // Générer un historique d'événements aléatoire
    const eventHistory = [];
    const numEvents = Math.floor(Math.random() * 10); // Entre 0 et 10 événements
    const usedEvents = new Set();
    
    for (let i = 0; i < numEvents && i < events.length; i++) {
        // Sélectionner un événement aléatoire
        let randomEventIndex;
        do {
            randomEventIndex = Math.floor(Math.random() * events.length);
        } while (usedEvents.has(randomEventIndex));
        
        usedEvents.add(randomEventIndex);
        
        const event = events[randomEventIndex];
        
        // Type d'interaction aléatoire
        const interactionTypes = ['viewed', 'registered', 'attended', 'cancelled'];
        const weights = [0.4, 0.3, 0.2, 0.1]; // Probabilités pour chaque type
        
        let interactionType;
        const rand = Math.random();
        let cumulativeWeight = 0;
        
        for (let j = 0; j < interactionTypes.length; j++) {
            cumulativeWeight += weights[j];
            if (rand < cumulativeWeight) {
                interactionType = interactionTypes[j];
                break;
            }
        }
        
        // Date d'interaction aléatoire (dans le passé)
        const interactionDate = new Date();
        interactionDate.setDate(interactionDate.getDate() - Math.floor(Math.random() * 30));
        
        // Ajouter l'événement à l'historique
        const historyEntry = {
            event: event._id,
            interactionType,
            interactionDate
        };
        
        // Ajouter une note et un commentaire si l'utilisateur a assisté à l'événement
        if (interactionType === 'attended') {
            historyEntry.rating = 1 + Math.floor(Math.random() * 5); // Note entre 1 et 5
            
            if (historyEntry.rating >= 4) {
                historyEntry.feedback = "Great event, really enjoyed it!";
            } else if (historyEntry.rating >= 3) {
                historyEntry.feedback = "Good event, but could be improved.";
            } else {
                historyEntry.feedback = "Not what I expected.";
            }
        }
        
        eventHistory.push(historyEntry);
        
        // Si l'utilisateur s'est inscrit ou a assisté à l'événement, l'ajouter à la liste des participants
        if (interactionType === 'registered' || interactionType === 'attended') {
            event.attendees.push(userId);
        }
    }
    
    return {
        user: userId,
        categoryPreferences,
        locationPreferences,
        timePreferences: {
            preferredDays,
            preferredTimeOfDay
        },
        eventHistory,
        lastUpdated: new Date()
    };
};

// Fonction principale pour générer les données
const seedRecommendationData = async () => {
    try {
        // Connexion à MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connecté à MongoDB');
        
        // Supprimer les données existantes
        await UserEventPreference.deleteMany({});
        console.log('Préférences utilisateur supprimées');
        
        // Récupérer les utilisateurs existants ou en créer de nouveaux
        let users = await User.find({ typeUser: 'user' });
        
        if (users.length < 10) {
            console.log('Création de nouveaux utilisateurs...');
            const newUsers = [];
            
            for (let i = 0; i < 20; i++) {
                const userData = await generateRandomUser(i + 1);
                newUsers.push(userData);
            }
            
            await User.insertMany(newUsers);
            console.log(`${newUsers.length} nouveaux utilisateurs créés`);
            
            users = await User.find({ typeUser: 'user' });
        }
        
        console.log(`${users.length} utilisateurs trouvés`);
        
        // Récupérer les événements existants ou en créer de nouveaux
        let events = await Event.find({});
        
        if (events.length < 20) {
            console.log('Création de nouveaux événements...');
            const newEvents = [];
            
            // Utiliser les utilisateurs comme organisateurs
            for (let i = 0; i < 50; i++) {
                const randomUserIndex = Math.floor(Math.random() * users.length);
                const eventData = generateRandomEvent(users[randomUserIndex]._id, i + 1);
                newEvents.push(eventData);
            }
            
            await Event.insertMany(newEvents);
            console.log(`${newEvents.length} nouveaux événements créés`);
            
            events = await Event.find({});
        }
        
        console.log(`${events.length} événements trouvés`);
        
        // Générer des préférences utilisateur
        const userPreferences = [];
        
        for (const user of users) {
            const preferences = generateRandomUserPreferences(user._id, events);
            userPreferences.push(preferences);
        }
        
        // Sauvegarder les préférences utilisateur
        await UserEventPreference.insertMany(userPreferences);
        console.log(`${userPreferences.length} préférences utilisateur créées`);
        
        // Mettre à jour les événements avec les participants
        for (const event of events) {
            await event.save();
        }
        console.log('Événements mis à jour avec les participants');
        
        console.log('Données de recommandation générées avec succès !');
    } catch (error) {
        console.error('Erreur lors de la génération des données :', error);
    } finally {
        // Fermer la connexion à MongoDB
        await mongoose.connection.close();
        console.log('Connexion à MongoDB fermée');
    }
};

// Exécuter le script
seedRecommendationData();
