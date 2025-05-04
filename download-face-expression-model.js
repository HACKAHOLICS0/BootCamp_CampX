const fs = require('fs');
const path = require('path');
const https = require('https');

// Define the directory where models should be saved
const modelsDir = path.join(__dirname, 'pi', 'public', 'models');

// Create the directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
  console.log(`Created directory: ${modelsDir}`);
}

// Define the files to download
const filesToDownload = [
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1'
];

// Base URL for the model files
const baseUrl = 'https://justadudewhohacks.github.io/face-api.js/models';

// Function to download a file
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url} to ${filePath}...`);
    
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${url} successfully`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete the file if there was an error
      reject(err);
    });
  });
}

// Download all files
async function downloadAllFiles() {
  try {
    for (const fileName of filesToDownload) {
      const url = `${baseUrl}/${fileName}`;
      const filePath = path.join(modelsDir, fileName);
      
      await downloadFile(url, filePath);
    }
    
    console.log('All files downloaded successfully!');
  } catch (error) {
    console.error('Error downloading files:', error);
  }
}

// Start the download
downloadAllFiles();
