const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

// Route pour générer des questions à partir de la transcription
router.post('/generate', async (req, res) => {
    try {
        const { transcript, videoTitle } = req.body;

        if (!transcript) {
            return res.status(400).json({ error: 'Transcription requise' });
        }

        console.log(`Génération de questions pour la vidéo: ${videoTitle || 'Sans titre'}`);
        console.log(`Longueur de la transcription: ${transcript.length} caractères`);

        // Lancer le script Python avec la transcription et le titre comme arguments
        const pythonProcess = spawn('python', [
            path.join(__dirname, '../models/QuestionGenerator.py'),
            transcript,
            videoTitle || ''
        ]);

        let questionData = '';
        let errorData = '';

        // Collecter les données de sortie
        pythonProcess.stdout.on('data', (data) => {
            questionData += data.toString();
        });

        // Collecter les erreurs
        pythonProcess.stderr.on('data', (data) => {
            console.error('Erreur Python:', data.toString());
            errorData += data.toString();
        });

        // Gérer la fin du processus
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error('Erreur du processus Python:', errorData);
                return res.status(500).json({
                    error: 'Erreur lors de la génération des questions',
                    details: errorData
                });
            }

            try {
                // Vérifier si nous avons des données
                if (!questionData.trim()) {
                    return res.status(500).json({
                        error: 'Aucune question générée',
                        details: 'Le script Python n\'a pas généré de questions'
                    });
                }

                const questions = JSON.parse(questionData);

                // Vérifier si nous avons des questions valides
                if (!Array.isArray(questions) || questions.length === 0) {
                    return res.status(500).json({
                        error: 'Aucune question valide générée',
                        details: 'Le script a retourné un tableau vide ou invalide'
                    });
                }

                res.json(questions);
            } catch (error) {
                console.error('Erreur de parsing JSON:', error, 'Data:', questionData);
                res.status(500).json({
                    error: 'Erreur lors du parsing des questions',
                    details: error.message,
                    rawData: questionData
                });
            }
        });

    } catch (error) {
        console.error('Erreur serveur:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            details: error.message
        });
    }
});

module.exports = router;