// Configuration de Stripe avec gestion de l'absence de clé API
let stripe;

// Vérifier si la clé API est disponible
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  // Créer un objet mock pour le développement sans clé API
  console.warn('⚠️ AVERTISSEMENT: Aucune clé API Stripe trouvée. Utilisation du mode mock.');
  console.warn('Pour activer Stripe, ajoutez STRIPE_SECRET_KEY à votre fichier .env');
  
  // Créer un objet stripe simulé avec des méthodes qui ne font rien
  stripe = {
    paymentIntents: {
      create: async () => ({ 
        id: 'mock_payment_intent_id', 
        client_secret: 'mock_client_secret',
        status: 'succeeded'
      }),
      retrieve: async () => ({ 
        id: 'mock_payment_intent_id',
        status: 'succeeded',
        metadata: { courseId: 'mock_course_id', userId: 'mock_user_id' }
      })
    },
    webhooks: {
      constructEvent: (body, signature, secret) => ({
        type: 'payment_intent.succeeded',
        data: { 
          object: { 
            id: 'mock_payment_intent_id',
            status: 'succeeded',
            metadata: { courseId: 'mock_course_id', userId: 'mock_user_id' }
          }
        }
      })
    }
  };
}

module.exports = stripe;