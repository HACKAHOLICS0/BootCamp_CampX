const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
const MarketTrend = require('../Model/MarketTrend'); // Importer le modèle

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/HACKAHOLICS', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connexion à MongoDB réussie');
}).catch(err => {
  console.error('Erreur de connexion à MongoDB', err);
});

// Exemple de scraping
const scrapeMarketInsights = async () => {
    const url = 'https://www.amazon.com/s?k=laptop'; // Lien pour la recherche de laptops sur Amazon

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Log pour afficher le HTML
    console.log('HTML récupéré :', data); // Affiche l'HTML pour vérification

    // Cibler les titres des articles sur eBay
    $('li.s-item').each(async (index, element) => {
      const title = $(element).find('h3.s-item__title').text().trim();
      console.log('Titre trouvé:', trendTitle);

      if (title) { // Vérifiez si un titre est extrait
        const marketTrend = new MarketTrend({
          title: title,
          description: 'Description de la tendance (si disponible)',
        });
      
        console.log('Donnée prête à être sauvegardée :', marketTrend); // Log des données prêtes à être sauvegardées
      
     
      
        // Sauvegarder dans la base de données MongoDB
        try {
          await marketTrend.save();
          console.log('Donnée sauvegardée :', marketTrend); // Affiche la donnée sauvegardée
        } catch (error) {
          console.error('Erreur lors de l\'insertion dans la base de données :', error);
        }
      }
    });

    console.log('Données de marché sauvegardées !');
  } catch (error) {
    console.error('Erreur lors du scraping:', error);
  }
};

// Exécuter la fonction de scraping
scrapeMarketInsights();
