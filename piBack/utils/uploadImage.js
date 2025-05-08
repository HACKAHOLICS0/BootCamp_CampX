const fs = require('fs');
const path = require('path');

/**
 * Traite un fichier déjà téléchargé par multer
 * @param {Object} file - Objet fichier de multer
 * @returns {String} - Chemin relatif du fichier pour la base de données
 */
const uploadImage = async (file) => {
    try {
        console.log('Processing uploaded file:', file);

        // Le fichier est déjà enregistré par multer, nous avons juste besoin de retourner le chemin
        if (!file || !file.path) {
            console.error('Invalid file object:', file);
            throw new Error('Invalid file object');
        }

        // Vérifier si le fichier existe
        if (!fs.existsSync(file.path)) {
            console.error('File does not exist at path:', file.path);
            throw new Error('File does not exist at the specified path');
        }

        // Extraire le chemin relatif à partir de "uploads/"
        const fullPath = file.path.replace(/\\/g, '/'); // Normaliser les slashes
        const uploadsIndex = fullPath.indexOf('uploads/');
        
        let relativePath;
        if (uploadsIndex !== -1) {
            // Extraire seulement la partie relative du chemin (uploads/...)
            relativePath = fullPath.substring(uploadsIndex);
            console.log('Extracted relative path:', relativePath);
        } else {
            // Si "uploads/" n'est pas trouvé, utiliser le chemin complet sans slash au début
            relativePath = fullPath;
            console.log('Using full path as relative path:', relativePath);
        }

        return relativePath; // Ne pas ajouter de slash au début
    } catch (error) {
        console.error('Error processing image:', error);
        throw error;
    }
};

module.exports = { uploadImage };
