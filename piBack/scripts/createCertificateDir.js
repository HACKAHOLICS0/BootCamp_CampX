/**
 * Script to create the certificates directory if it doesn't exist
 */
const fs = require('fs');
const path = require('path');

// Path to the certificates directory
const certificatesDir = path.join(__dirname, '..', 'uploads', 'certificates');

// Check if the directory exists
if (!fs.existsSync(certificatesDir)) {
    console.log(`Creating certificates directory: ${certificatesDir}`);
    try {
        fs.mkdirSync(certificatesDir, { recursive: true });
        console.log('Certificates directory created successfully');
        
        // Set permissions to ensure it's writable
        fs.chmodSync(certificatesDir, 0o777);
        console.log('Permissions set to 777');
    } catch (error) {
        console.error('Error creating certificates directory:', error);
    }
} else {
    console.log(`Certificates directory already exists: ${certificatesDir}`);
    
    // Set permissions to ensure it's writable
    try {
        fs.chmodSync(certificatesDir, 0o777);
        console.log('Permissions set to 777');
    } catch (error) {
        console.error('Error setting permissions:', error);
    }
}

// Create a test file to verify write permissions
const testFilePath = path.join(certificatesDir, 'test.txt');
try {
    fs.writeFileSync(testFilePath, 'This is a test file to verify write permissions.');
    console.log(`Test file created: ${testFilePath}`);
    
    // Clean up the test file
    fs.unlinkSync(testFilePath);
    console.log('Test file removed');
} catch (error) {
    console.error('Error writing test file:', error);
}

console.log('Script completed');
