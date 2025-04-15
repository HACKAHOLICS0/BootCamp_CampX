const fs = require('fs');
const path = require('path');

const uploadImage = async (file) => {
    try {
        // Create uploads directory if it doesn't exist
        const uploadDir = path.join(__dirname, '../uploads/events');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
        const filepath = path.join(uploadDir, filename);

        // Save file
        await fs.promises.writeFile(filepath, file.buffer);

        // Return the relative path for the database
        return `/uploads/events/${filename}`;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

module.exports = { uploadImage };