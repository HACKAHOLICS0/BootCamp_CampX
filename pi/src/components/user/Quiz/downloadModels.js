const fs = require('fs');
const path = require('path');
const https = require('https');

const modelsDir = path.join(__dirname, '../../../../public/models');

const modelFiles = [
    'face_landmark_68_model-shard1',
    'face_landmark_68_tiny_model-shard1',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2',
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2',
    'tiny_face_detector_model-shard1'
];

const manifestFiles = [
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_tiny_model-weights_manifest.json',
    'face_recognition_model-weights_manifest.json',
    'ssd_mobilenetv1_model-weights_manifest.json',
    'tiny_face_detector_model-weights_manifest.json'
];

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function downloadModels() {
    if (!fs.existsSync(modelsDir)) {
        fs.mkdirSync(modelsDir, { recursive: true });
    }

    console.log('📥 Téléchargement des modèles...');
    
    // Téléchargement des fichiers de poids
    for (const model of modelFiles) {
        const fileName = `${model}.weights`;
        const destPath = path.join(modelsDir, fileName);
        const url = `${baseUrl}/${fileName}`;
        
        if (fs.existsSync(destPath)) {
            console.log(`✅ ${fileName} existe déjà`);
            continue;
        }
        
        console.log(`📦 Téléchargement de ${fileName}...`);
        try {
            await downloadFile(url, destPath);
            console.log(`✅ ${fileName} téléchargé avec succès`);
        } catch (err) {
            console.error(`❌ Erreur lors du téléchargement de ${fileName}:`, err);
        }
    }
    
    // Téléchargement des fichiers manifestes
    for (const manifest of manifestFiles) {
        const destPath = path.join(modelsDir, manifest);
        const url = `${baseUrl}/${manifest}`;
        
        if (fs.existsSync(destPath)) {
            console.log(`✅ ${manifest} existe déjà`);
            continue;
        }
        
        console.log(`📄 Téléchargement de ${manifest}...`);
        try {
            await downloadFile(url, destPath);
            console.log(`✅ ${manifest} téléchargé avec succès`);
        } catch (err) {
            console.error(`❌ Erreur lors du téléchargement de ${manifest}:`, err);
        }
    }
    
    console.log('✨ Téléchargement des modèles terminé');
}

downloadModels();
