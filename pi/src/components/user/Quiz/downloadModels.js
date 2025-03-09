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
  'ssd_mobilenetv1_model-shard2'
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

  console.log('Téléchargement des modèles...');
  
  for (const model of modelFiles) {
    const fileName = `${model}.weights`;
    const destPath = path.join(modelsDir, fileName);
    const url = `${baseUrl}/${fileName}`;
    
    console.log(`Téléchargement de ${fileName}...`);
    try {
      await downloadFile(url, destPath);
      console.log(`${fileName} téléchargé avec succès`);
    } catch (err) {
      console.error(`Erreur lors du téléchargement de ${fileName}:`, err);
    }
  }
  
  console.log('Téléchargement des modèles terminé');
}

downloadModels();
