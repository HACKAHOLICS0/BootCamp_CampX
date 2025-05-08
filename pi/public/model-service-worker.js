// Service Worker pour intercepter les requêtes de modèles face-api.js

const CACHE_NAME = 'face-api-models-cache-v1';
const MODEL_FILES = [
  '/models/tiny_face_detector_model-weights_manifest.json',
  '/models/tiny_face_detector_model-shard1',
  '/models/face_landmark_68_model-weights_manifest.json',
  '/models/face_landmark_68_model-shard1',
  '/models/face_recognition_model-weights_manifest.json',
  '/models/face_recognition_model-shard1',
  '/models/face_recognition_model-shard2',
  '/models/face_expression_model-weights_manifest.json',
  '/models/face_expression_model-shard1'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installation');
  
  // Passer à l'état activé immédiatement
  self.skipWaiting();
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activation');
  
  // Prendre le contrôle immédiatement
  event.waitUntil(clients.claim());
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Vérifier si la requête concerne un modèle face-api.js
  if (url.pathname.startsWith('/models/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Si le modèle est dans le cache, le retourner
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Sinon, essayer de le télécharger depuis le CDN
        const modelName = url.pathname.split('/').pop();
        const cdnUrl = `https://justadudewhohacks.github.io/face-api.js/models/${modelName}`;
        
        return fetch(cdnUrl)
          .then((response) => {
            // Vérifier si la réponse est valide
            if (!response || response.status !== 200) {
              return response;
            }
            
            // Cloner la réponse pour pouvoir la mettre en cache
            const responseToCache = response.clone();
            
            // Mettre en cache la réponse
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
                console.log(`Service Worker: Modèle ${modelName} mis en cache`);
              });
            
            return response;
          })
          .catch((error) => {
            console.error(`Service Worker: Erreur lors du téléchargement du modèle ${modelName}:`, error);
            // Retourner une réponse d'erreur
            return new Response(JSON.stringify({ error: 'Modèle non disponible' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' }
            });
          });
      })
    );
  } else {
    // Pour les autres requêtes, laisser le navigateur gérer normalement
    return;
  }
});
