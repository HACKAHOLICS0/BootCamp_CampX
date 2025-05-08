const mongoose = require('mongoose');
const Event = require('../Model/Event');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../config/.env') });

// Connexion à MongoDB
const connectDB = async () => {
  try {
    // Utiliser directement l'URL de connexion MongoDB
    const MONGO_URI = 'mongodb://127.0.0.1:27017/HACKAHOLICS';
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connexion à MongoDB réussie');
  } catch (err) {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
  }
};

// Données pour générer des événements aléatoires
const eventData = {
  categories: [
    'workshop', 'conference', 'networking', 'hackathon', 'seminar',
    'webinar', 'training', 'meetup', 'exhibition', 'competition'
  ],
  locations: [
    'Esprit', 'Tekup', 'Sesame', 'INSAT', 'ENIT', 'ENSI', 'FST', 'ISET',
    'Université de Carthage', 'Université de Tunis', 'Université de Manouba',
    'Parc des expositions du Kram', 'Cité des Sciences', 'Palais des Congrès'
  ],
  titles: [
    'Introduction à l\'Intelligence Artificielle',
    'Développement Web avec React',
    'DevOps et CI/CD',
    'Cybersécurité pour les développeurs',
    'Machine Learning avec Python',
    'Blockchain et applications décentralisées',
    'UX/UI Design Workshop',
    'Mobile Development avec Flutter',
    'Data Science et Big Data',
    'Cloud Computing avec AWS',
    'IoT et systèmes embarqués',
    'Agile et Scrum',
    'Réseaux et protocoles',
    'Bases de données NoSQL',
    'API REST et GraphQL',
    'Microservices Architecture',
    'Programmation fonctionnelle',
    'Test Driven Development',
    'Containerisation avec Docker',
    'Orchestration avec Kubernetes'
  ],
  descriptions: [
    'Un événement pour découvrir les fondamentaux et les applications pratiques.',
    'Apprenez les meilleures pratiques et les dernières tendances dans ce domaine.',
    'Une opportunité unique de développer vos compétences et d\'élargir votre réseau professionnel.',
    'Rejoignez-nous pour une journée d\'apprentissage intensif et d\'échanges enrichissants.',
    'Des experts du domaine partageront leurs connaissances et expériences.',
    'Cet événement combinera théorie et pratique pour une expérience d\'apprentissage complète.',
    'Idéal pour les débutants comme pour les professionnels cherchant à approfondir leurs connaissances.',
    'Une occasion de collaborer avec d\'autres passionnés et de créer des projets innovants.',
    'Venez découvrir les dernières innovations et tendances du secteur.',
    'Un programme riche en contenu avec des intervenants de haut niveau.'
  ],
  // ID d'un utilisateur admin existant (à remplacer par un ID valide de votre base de données)
  organizerId: '67b21a98d16205f25de83b08' // ID de l'utilisateur khalil.benyahiawenich@esprit.tn
};

// Fonction pour générer un nombre aléatoire entre min et max
const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Fonction pour générer une date aléatoire dans les 6 prochains mois
const getRandomDate = () => {
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(now.getDate() + getRandomInt(1, 180)); // Entre 1 jour et 6 mois dans le futur
  return futureDate;
};

// Fonction pour générer un événement aléatoire
const generateRandomEvent = () => {
  const title = eventData.titles[getRandomInt(0, eventData.titles.length - 1)];
  const category = eventData.categories[getRandomInt(0, eventData.categories.length - 1)];
  const description = `${title} - ${eventData.descriptions[getRandomInt(0, eventData.descriptions.length - 1)]} Cette ${category} se tiendra à ${eventData.locations[getRandomInt(0, eventData.locations.length - 1)]}.`;

  return {
    title,
    description,
    date: getRandomDate(),
    location: eventData.locations[getRandomInt(0, eventData.locations.length - 1)],
    organizer: eventData.organizerId,
    maxAttendees: getRandomInt(20, 200),
    category,
    status: 'upcoming',
    isApproved: true, // Approuvé par défaut pour faciliter les tests
    approvedBy: eventData.organizerId,
    approvedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

// Fonction principale pour ajouter les événements
const addTestEvents = async (count) => {
  try {
    await connectDB();

    console.log(`Ajout de ${count} événements de test...`);

    // Supprimer les événements existants (optionnel)
    // await Event.deleteMany({});
    // console.log('Événements existants supprimés');

    // Générer et ajouter les nouveaux événements
    const events = [];
    for (let i = 0; i < count; i++) {
      events.push(generateRandomEvent());
    }

    const result = await Event.insertMany(events);
    console.log(`${result.length} événements ajoutés avec succès!`);

    // Afficher quelques événements pour vérification
    console.log('Exemples d\'événements ajoutés:');
    for (let i = 0; i < Math.min(3, result.length); i++) {
      console.log(`- ${result[i].title} (${result[i].category}) à ${result[i].location} le ${result[i].date.toLocaleDateString()}`);
    }

    mongoose.connection.close();
    console.log('Connexion à MongoDB fermée');
  } catch (error) {
    console.error('Erreur lors de l\'ajout des événements:', error);
    mongoose.connection.close();
  }
};

// Exécuter le script avec 40 événements
addTestEvents(40);
