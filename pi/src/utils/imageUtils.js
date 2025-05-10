// Utilitaire pour gérer les URLs d'images
const backendURL = "https://ikramsegni.fr";

// Fonction pour obtenir l'URL d'image d'un événement
export const getEventImageUrl = (event) => {
    console.log("Event image path:", event.image);
    
    // Vérifie si l'événement ou son image est défini
    if (!event || !event.image || event.image === 'undefined') {
        return `${backendURL}/uploads/events/default-event.jpg`; // Image par défaut avec URL complète
    }

    // Si l'image est déjà une URL complète
    if (event.image.startsWith("http")) {
        return event.image;
    }

    // Si l'image commence par // (erreur courante)
    if (event.image.startsWith('//')) {
        // Enlever le premier slash
        const correctedPath = event.image.substring(1);
        return `${backendURL}${correctedPath}`;
    }

    // Si l'image contient le chemin complet du serveur
    if (event.image.includes('/home/ubuntu/camp-final/campx_finale/piBack/')) {
        // Extraire la partie relative du chemin (après 'piBack/')
        const relativePath = event.image.split('piBack/')[1];
        return `${backendURL}/${relativePath}`;
    }

    // Cas pour les chemins avec backslashes
    if (event.image.includes('\\')) {
        // Remplacer tous les backslashes par des forward slashes
        const normalizedPath = event.image.replace(/\\/g, "/");
        return `${backendURL}/${normalizedPath}`;
    }

    // Pour les chemins relatifs standards (uploads/...)
    if (event.image.startsWith('uploads/')) {
        return `${backendURL}/${event.image}`;
    }

    // Fallback pour tout autre format - toujours utiliser l'URL complète
    return `${backendURL}/${event.image}`;
};

// Fonction pour obtenir l'URL d'image d'un utilisateur
export const getUserImageUrl = (user) => {
    // Vérifie si l'utilisateur ou son image est défini
    if (!user || !user.image) {
        return `${backendURL}/uploads/avatar7.png`; // Image par défaut avec URL complète
    }

    // Si l'utilisateur utilise Google ou GitHub
    if (user.googleId || user.authProvider === "github" || user.authProvider === "google") {
        return user.image; // Retourner directement l'URL de l'image
    }

    // Utiliser la même logique que pour les images d'événements
    return getEventImageUrl({ image: user.image });
};

