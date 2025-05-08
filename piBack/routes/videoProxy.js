const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const { authMiddleware } = require('../middleware/authMiddleware');

// Fonction pour extraire les informations d'une URL YouTube
const extractYouTubeInfo = (url) => {
  let videoId = null;
  
  // Format: https://www.youtube.com/watch?v=VIDEO_ID
  if (url.includes('youtube.com/watch')) {
    const urlObj = new URL(url);
    videoId = urlObj.searchParams.get('v');
  } 
  // Format: https://youtu.be/VIDEO_ID
  else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0];
  }
  
  if (videoId) {
    return {
      success: true,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
      platform: 'YouTube'
    };
  }
  
  return { success: false, message: 'Format YouTube non reconnu' };
};

// Fonction pour extraire les informations d'une URL Coursera
const extractCourseraInfo = async (url) => {
  try {
    // Tenter de récupérer la page Coursera
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
        'Referer': 'https://www.google.com/'
      },
      timeout: 10000
    });
    
    // Analyser la page HTML
    const $ = cheerio.load(response.data);
    
    // Extraire le titre de la vidéo
    const title = $('title').text().trim();
    
    // Extraire l'URL de la vidéo (si disponible)
    const videoUrl = $('meta[property="og:video"]').attr('content') || 
                    $('meta[property="og:video:url"]').attr('content');
    
    // Extraire l'image de prévisualisation
    const previewImage = $('meta[property="og:image"]').attr('content');
    
    // Extraire la description
    const description = $('meta[property="og:description"]').attr('content') || 
                       $('meta[name="description"]').attr('content');
    
    return {
      success: true,
      title: title || 'Cours Coursera',
      description: description || 'Contenu éducatif de Coursera',
      previewImage: previewImage,
      originalUrl: url,
      platform: 'Coursera',
      // Coursera bloque l'intégration, donc nous ne pouvons pas fournir d'URL d'intégration
      embedUrl: null,
      // Indiquer que cette vidéo ne peut pas être intégrée
      canEmbed: false
    };
  } catch (error) {
    console.error('Erreur lors de l\'extraction des informations Coursera:', error);
    return { 
      success: false, 
      message: 'Impossible d\'accéder au contenu Coursera',
      canEmbed: false,
      platform: 'Coursera',
      originalUrl: url
    };
  }
};

// Fonction pour extraire les informations d'une URL Udemy
const extractUdemyInfo = async (url) => {
  try {
    // Tenter de récupérer la page Udemy
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
        'Referer': 'https://www.google.com/'
      },
      timeout: 10000
    });
    
    // Analyser la page HTML
    const $ = cheerio.load(response.data);
    
    // Extraire le titre de la vidéo
    const title = $('title').text().trim();
    
    // Extraire l'image de prévisualisation
    const previewImage = $('meta[property="og:image"]').attr('content');
    
    // Extraire la description
    const description = $('meta[property="og:description"]').attr('content') || 
                       $('meta[name="description"]').attr('content');
    
    return {
      success: true,
      title: title || 'Cours Udemy',
      description: description || 'Contenu éducatif de Udemy',
      previewImage: previewImage,
      originalUrl: url,
      platform: 'Udemy',
      // Udemy bloque généralement l'intégration
      embedUrl: null,
      canEmbed: false
    };
  } catch (error) {
    console.error('Erreur lors de l\'extraction des informations Udemy:', error);
    return { 
      success: false, 
      message: 'Impossible d\'accéder au contenu Udemy',
      canEmbed: false,
      platform: 'Udemy',
      originalUrl: url
    };
  }
};

// Route pour obtenir l'URL d'intégration d'une vidéo
router.get('/embed', authMiddleware, async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL manquante' });
    }
    
    // Déterminer la plateforme
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const youtubeInfo = extractYouTubeInfo(url);
      return res.json({
        success: true,
        embedUrl: youtubeInfo.embedUrl,
        platform: 'YouTube',
        canEmbed: true
      });
    } 
    else if (url.includes('coursera.org')) {
      const courseraInfo = await extractCourseraInfo(url);
      return res.json(courseraInfo);
    }
    else if (url.includes('udemy.com')) {
      const udemyInfo = await extractUdemyInfo(url);
      return res.json(udemyInfo);
    }
    else {
      // Pour les autres plateformes, essayer une approche générique
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 8000
        });
        
        const $ = cheerio.load(response.data);
        const title = $('title').text().trim();
        const platform = url.split('/')[2].replace('www.', '');
        
        return res.json({
          success: true,
          title: title || 'Vidéo externe',
          originalUrl: url,
          platform: platform,
          canEmbed: false,
          message: 'Cette plateforme ne permet pas l\'intégration directe'
        });
      } catch (error) {
        console.error('Erreur lors de l\'extraction des informations génériques:', error);
        return res.json({
          success: false,
          message: 'Impossible d\'accéder au contenu',
          originalUrl: url,
          canEmbed: false
        });
      }
    }
  } catch (error) {
    console.error('Erreur lors du traitement de la requête de proxy vidéo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du traitement de la requête',
      error: error.message
    });
  }
});

// Route pour obtenir des métadonnées sur une vidéo
router.get('/metadata', authMiddleware, async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL manquante' });
    }
    
    // Tenter de récupérer les métadonnées de la page
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 8000
    });
    
    const $ = cheerio.load(response.data);
    
    // Extraire les métadonnées
    const metadata = {
      title: $('title').text().trim(),
      description: $('meta[name="description"]').attr('content') || '',
      ogTitle: $('meta[property="og:title"]').attr('content') || '',
      ogDescription: $('meta[property="og:description"]').attr('content') || '',
      ogImage: $('meta[property="og:image"]').attr('content') || '',
      ogType: $('meta[property="og:type"]').attr('content') || '',
      ogUrl: $('meta[property="og:url"]').attr('content') || '',
      twitterCard: $('meta[name="twitter:card"]').attr('content') || '',
      twitterTitle: $('meta[name="twitter:title"]').attr('content') || '',
      twitterDescription: $('meta[name="twitter:description"]').attr('content') || '',
      twitterImage: $('meta[name="twitter:image"]').attr('content') || ''
    };
    
    res.json({
      success: true,
      metadata
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des métadonnées:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des métadonnées',
      error: error.message
    });
  }
});

module.exports = router;
