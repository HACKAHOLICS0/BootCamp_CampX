const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/authMiddleware');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data/market_insights');
if (!fs.existsSync(dataDir)) {
    try {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`Created directory: ${dataDir}`);
    } catch (err) {
        console.error(`Error creating directory ${dataDir}:`, err);
    }
}

// Search for market insights based on search term
router.get('/search/:term', authMiddleware, (req, res) => {
    const searchTerm = req.params.term;
    const pythonScript = path.join(__dirname, '../scripts/market_analyzer.py');

    // Sanitize the search term for filenames
    const sanitizedSearchTerm = searchTerm.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '_');
    const filename = `${sanitizedSearchTerm}_${timestamp}.json`;
    const outputPath = path.join(dataDir, filename);

    console.log(`Running market analysis for: ${searchTerm}`);

    // Run the Python script with the search term
    const pythonProcess = spawn('python', [pythonScript, searchTerm]);

    let scriptOutput = '';
    let scriptError = '';

    pythonProcess.stdout.on('data', (data) => {
        scriptOutput += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        scriptError += data.toString();
        console.error(`Python script error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python script exited with code ${code}`);

        if (code !== 0) {
            return res.status(500).json({
                success: false,
                message: 'Error running market analysis script',
                error: scriptError || 'Unknown error'
            });
        }

        try {
            // Parse the JSON output from the script
            const analysisResults = JSON.parse(scriptOutput);

            // Check if the script returned an error
            if (analysisResults.status === 'error') {
                return res.status(500).json({
                    success: false,
                    message: 'Market analysis script returned an error',
                    error: analysisResults.message || 'Unknown error'
                });
            }

            // Save the results to a file
            fs.writeFileSync(outputPath, JSON.stringify(analysisResults, null, 2), 'utf8');
            console.log(`Market insights saved to: ${outputPath}`);

            // Return the results
            return res.json({
                success: true,
                data: analysisResults
            });
        } catch (err) {
            console.error('Error processing Python script output:', err);
            console.error('Script output:', scriptOutput);

            return res.status(500).json({
                success: false,
                message: 'Error processing market analysis results',
                error: err.message
            });
        }
    });
});

// Get history of market insights
router.get('/history', authMiddleware, (req, res) => {
    try {
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            return res.json({
                success: true,
                data: []
            });
        }

        const files = fs.readdirSync(dataDir);
        const insights = [];

        files.forEach(file => {
            if (file.endsWith('.json')) {
                try {
                    const filePath = path.join(dataDir, file);
                    const fileContent = fs.readFileSync(filePath, 'utf8');
                    const data = JSON.parse(fileContent);

                    // Extract search term and timestamp from filename
                    const [searchTerm, timestamp] = file.replace('.json', '').split('_');

                    insights.push({
                        searchTerm: data.search_term || searchTerm,
                        timestamp: data.timestamp || new Date().toISOString(),
                        totalCourses: data.total_courses || 0,
                        platforms: data.platform_distribution || {},
                        filename: file
                    });
                } catch (err) {
                    console.error(`Error reading file ${file}:`, err);
                }
            }
        });

        // Sort insights by timestamp (most recent first)
        insights.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return res.json({
            success: true,
            data: insights
        });
    } catch (err) {
        console.error('Error fetching market insights history:', err);
        return res.status(500).json({
            success: false,
            message: 'Error fetching market insights history',
            error: err.message
        });
    }
});

// Get details of a specific market insight
router.get('/detail/:searchTerm/:timestamp', authMiddleware, (req, res) => {
    try {
        const { searchTerm, timestamp } = req.params;
        const sanitizedSearchTerm = searchTerm.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const sanitizedTimestamp = timestamp.replace(/[:.]/g, '_');

        const filename = `${sanitizedSearchTerm}_${sanitizedTimestamp}.json`;
        const filePath = path.join(dataDir, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Market insight not found'
            });
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileContent);

        return res.json({
            success: true,
            data
        });
    } catch (err) {
        console.error('Error fetching market insight details:', err);
        return res.status(500).json({
            success: false,
            message: 'Error fetching market insight details',
            error: err.message
        });
    }
});

// Get recommended courses for a category
router.get('/recommended/:category?', authMiddleware, async (req, res) => {
    try {
        const category = req.params.category || 'programming';
        const limit = parseInt(req.query.limit) || 6;

        // Rechercher d'abord dans l'historique des analyses
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        const files = fs.readdirSync(dataDir);
        let latestFile = null;
        let latestTimestamp = 0;

        // Chercher le fichier le plus récent correspondant à la catégorie
        for (const file of files) {
            if (file.endsWith('.json') && file.toLowerCase().includes(category.toLowerCase())) {
                const filePath = path.join(dataDir, file);
                const stats = fs.statSync(filePath);

                if (stats.mtimeMs > latestTimestamp) {
                    latestTimestamp = stats.mtimeMs;
                    latestFile = filePath;
                }
            }
        }

        // Si un fichier correspondant est trouvé, l'utiliser
        if (latestFile) {
            const fileContent = fs.readFileSync(latestFile, 'utf8');
            const data = JSON.parse(fileContent);

            // Extraire et formater les cours
            const courses = data.courses || [];
            const limitedCourses = courses.slice(0, limit);

            return res.json({
                success: true,
                data: {
                    courses: limitedCourses,
                    category: category,
                    source: 'cached'
                }
            });
        }

        // Si aucun fichier n'est trouvé, effectuer une nouvelle recherche
        const pythonScript = path.join(__dirname, '../scripts/market_analyzer.py');
        const pythonProcess = spawn('python', [pythonScript, category]);

        let scriptOutput = '';
        let scriptError = '';

        pythonProcess.stdout.on('data', (data) => {
            scriptOutput += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            scriptError += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python script exited with code ${code}`);
                console.error('Script error output:', scriptError);

                return res.status(500).json({
                    success: false,
                    message: 'Error running market analysis script',
                    error: scriptError
                });
            }

            try {
                // Parse the JSON output from the script
                const analysisResults = JSON.parse(scriptOutput);

                // Check if the script returned an error
                if (analysisResults.status === 'error') {
                    return res.status(500).json({
                        success: false,
                        message: 'Market analysis script returned an error',
                        error: analysisResults.message || 'Unknown error'
                    });
                }

                // Extraire et formater les cours
                const courses = analysisResults.courses || [];
                const limitedCourses = courses.slice(0, limit);

                return res.json({
                    success: true,
                    data: {
                        courses: limitedCourses,
                        category: category,
                        source: 'fresh'
                    }
                });
            } catch (err) {
                console.error('Error processing Python script output:', err);
                console.error('Script output:', scriptOutput);

                return res.status(500).json({
                    success: false,
                    message: 'Error processing market analysis results',
                    error: err.message
                });
            }
        });
    } catch (err) {
        console.error('Error fetching recommended courses:', err);
        return res.status(500).json({
            success: false,
            message: 'Error fetching recommended courses',
            error: err.message
        });
    }
});

module.exports = router;