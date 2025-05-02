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

        // Convertir le chemin Windows en format URL (remplacer les backslashes par des forward slashes)
        const relativePath = '/' + file.path.replace(/\\/g, '/');
        console.log('Generated relative path:', relativePath);

        return relativePath;
    } catch (error) {
        console.error('Error processing image:', error);
        throw error;
    }
};

module.exports = { uploadImage };