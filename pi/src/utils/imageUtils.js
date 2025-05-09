// Utilitaire pour g�rer les URLs d'images
const backendURL = "https://ikramsegni.fr";

// Fonction pour obtenir l'URL d'image d'un �v�nement
export const getEventImageUrl = (event) => {
    console.log("Event image path:", event.image);
    
    // V�rifie si l'�v�nement ou son image est d�fini
    if (!event || !event.image || event.image === 'undefined') {
        return `${backendURL}/uploads/events/default-event.jpg`; // Image par d�faut avec URL compl�te
    }

    // Si l'image est d�j� une URL compl�te
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
        // Extraire la partie relative du chemin (apr�s 'piBack/')
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

    // Fallback pour tout autre format - toujours utiliser l'URL compl�te
    return `${backendURL}/${event.image}`;
};

// Fonction pour obtenir l'URL d'image d'un utilisateur
export const getUserImageUrl = (user) => {
    // V�rifie si l'utilisateur ou son image est d�fini
    if (!user || !user.image) {
        return `${backendURL}/uploads/avatar7.png`; // Image par d�faut avec URL compl�te
    }

    // Si l'utilisateur utilise Google ou GitHub
    if (user.googleId || user.authProvider === "github" || user.authProvider === "google") {
        return user.image; // Retourner directement l'URL de l'image
    }

    // Utiliser la m�me logique que pour les images d'�v�nements
    return getEventImageUrl({ image: user.image });
};

