const mongoose = require('mongoose');
const Certificate = require('../Model/Certificate');
const User = require('../Model/User');
const Course = require('../Model/Course');
const Module = require('../Model/Module');
const Quiz = require('../Model/Quiz');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Générer un certificat pour un utilisateur qui a complété un quiz final
exports.generateCertificate = async (userId, quizId, score, percentage) => {
    console.log("Début de la génération du certificat:");
    console.log("- userId:", userId);
    console.log("- quizId:", quizId);
    console.log("- score:", score);
    console.log("- percentage:", percentage);

    try {
        // Vérifier si le quiz est un quiz final
        const quiz = await Quiz.findById(quizId);
        console.log("Quiz trouvé:", quiz ? "Oui" : "Non");
        if (quiz) {
            console.log("- quiz.isFinalQuiz:", quiz.isFinalQuiz);
        }

        if (!quiz || !quiz.isFinalQuiz) {
            console.error("Ce quiz n'est pas un quiz final ou n'existe pas");
            throw new Error('Ce quiz n\'est pas un quiz final');
        }

        // Récupérer les informations du cours et du module
        const course = await Course.findById(quiz.course).populate('module');
        console.log("Cours trouvé:", course ? "Oui" : "Non");
        if (!course) {
            console.error("Cours non trouvé pour le quiz:", quizId);
            throw new Error('Cours non trouvé');
        }

        const module = await Module.findById(course.module);
        console.log("Module trouvé:", module ? "Oui" : "Non");
        if (!module) {
            console.error("Module non trouvé pour le cours:", course._id);
            throw new Error('Module non trouvé');
        }

        // Vérifier si un certificat existe déjà
        const existingCertificate = await Certificate.findOne({
            user: userId,
            quiz: quizId
        });

        if (existingCertificate) {
            console.log("Certificat existant trouvé, retour du certificat existant");
            return existingCertificate;
        }

        // Générer un numéro de certificat unique
        const certificateNumber = Certificate.generateCertificateNumber();
        console.log("Numéro de certificat généré:", certificateNumber);

        // Calculer la date d'expiration (1 an après la date d'émission)
        const issueDate = new Date();
        const expiryDate = new Date(issueDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        // Créer le certificat
        const certificate = new Certificate({
            user: userId,
            course: course._id,
            module: module._id,
            quiz: quizId,
            score,
            percentage,
            certificateNumber,
            issueDate,
            expiryDate,
            status: 'active'
        });

        console.log("Tentative de sauvegarde du certificat");
        await certificate.save();
        console.log("Certificat sauvegardé avec succès:", certificate._id);
        return certificate;
    } catch (error) {
        console.error('Erreur détaillée lors de la génération du certificat:', error);
        throw error;
    }
};

// Récupérer tous les certificats d'un utilisateur
exports.getUserCertificates = async (req, res) => {
    try {
        const userId = req.user._id;

        const certificates = await Certificate.find({ user: userId })
            .populate('course', 'title')
            .populate('module', 'title')
            .populate('quiz', 'title')
            .sort({ createdAt: -1 });

        res.status(200).json(certificates);
    } catch (error) {
        console.error('Erreur lors de la récupération des certificats:', error);
        res.status(500).json({ error: error.message });
    }
};

// Récupérer un certificat par son ID
exports.getCertificateById = async (req, res) => {
    try {
        const { certificateId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(certificateId)) {
            return res.status(400).json({ error: 'ID de certificat invalide' });
        }

        const certificate = await Certificate.findById(certificateId)
            .populate('user', 'name lastName email')
            .populate('course', 'title')
            .populate('module', 'title')
            .populate('quiz', 'title');

        if (!certificate) {
            return res.status(404).json({ error: 'Certificat non trouvé' });
        }

        // Vérifier que l'utilisateur est autorisé à voir ce certificat
        if (certificate.user._id.toString() !== req.user._id.toString() && req.user.typeUser !== 'admin') {
            return res.status(403).json({ error: 'Non autorisé à accéder à ce certificat' });
        }

        res.status(200).json(certificate);
    } catch (error) {
        console.error('Erreur lors de la récupération du certificat:', error);
        res.status(500).json({ error: error.message });
    }
};

// Générer un PDF du certificat
exports.generateCertificatePDF = async (req, res) => {
    try {
        const { certificateId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(certificateId)) {
            return res.status(400).json({ error: 'ID de certificat invalide' });
        }

        const certificate = await Certificate.findById(certificateId)
            .populate('user', 'name lastName email')
            .populate('course', 'title')
            .populate('module', 'title')
            .populate('quiz', 'title');

        if (!certificate) {
            return res.status(404).json({ error: 'Certificat non trouvé' });
        }

        // Vérifier que l'utilisateur est autorisé à voir ce certificat
        if (certificate.user._id.toString() !== req.user._id.toString() && req.user.typeUser !== 'admin') {
            return res.status(403).json({ error: 'Non autorisé à accéder à ce certificat' });
        }

        // Créer un document PDF
        const doc = new PDFDocument({
            size: 'A4',
            layout: 'landscape',
            margin: 50
        });

        // Définir le nom du fichier
        const fileName = `certificate-${certificate.certificateNumber}.pdf`;
        const filePath = path.join(__dirname, '..', 'uploads', 'certificates', fileName);

        // Assurer que le répertoire existe
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Pipe le PDF vers un fichier et la réponse
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Configurer les en-têtes de réponse
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        doc.pipe(res);

        // Ajouter une bordure décorative
        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
           .lineWidth(3)
           .stroke('#1E88E5');

        // Ajouter le nom CAMP X en haut
        doc.font('Helvetica-Bold')
           .fontSize(36)
           .fillColor('#5FCF80')
           .text('CAMP X', { align: 'center' })
           .moveDown(0.5);

        // Ajouter un titre
        doc.font('Helvetica-Bold')
           .fontSize(30)
           .fillColor('#1E88E5')
           .text('CERTIFICAT DE RÉUSSITE', { align: 'center', lineGap: 20 })
           .moveDown(0.5);

        // Ajouter le texte principal
        doc.font('Helvetica')
           .fontSize(16)
           .fillColor('#333333')
           .text('Ce certificat est décerné à', { align: 'center' })
           .moveDown(0.5);

        // Nom de l'utilisateur
        doc.font('Helvetica-Bold')
           .fontSize(24)
           .fillColor('#000000')
           .text(`${certificate.user.name} ${certificate.user.lastName}`, { align: 'center' })
           .moveDown(1);

        // Détails du cours
        doc.font('Helvetica')
           .fontSize(16)
           .fillColor('#333333')
           .text('pour avoir complété avec succès', { align: 'center' })
           .moveDown(0.5);

        doc.font('Helvetica-Bold')
           .fontSize(20)
           .fillColor('#1E88E5')
           .text(`${certificate.module.title}: ${certificate.course.title}`, { align: 'center' })
           .moveDown(1);

        // Score
        doc.font('Helvetica')
           .fontSize(16)
           .fillColor('#333333')
           .text(`avec un score de ${certificate.percentage}%`, { align: 'center' })
           .moveDown(2);

        // Date et numéro de certificat
        const issueDate = new Date(certificate.issueDate).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        doc.fontSize(12)
           .text(`Date d'émission: ${issueDate}`, { align: 'center' })
           .text(`Numéro de certificat: ${certificate.certificateNumber}`, { align: 'center' })
           .moveDown(2);

        // Signature (texte)
        doc.font('Helvetica-Bold')
           .fontSize(14)
           .text('Signature', 200, doc.y, { align: 'center' })
           .moveDown(0.5);

        // Ligne de signature
        doc.lineWidth(1)
           .moveTo(150, doc.y)
           .lineTo(300, doc.y)
           .stroke();

        // Finaliser le PDF
        doc.end();

        // Attendre que le fichier soit écrit
        stream.on('finish', () => {
            console.log(`Certificat PDF généré: ${filePath}`);
        });

    } catch (error) {
        console.error('Erreur lors de la génération du PDF:', error);
        res.status(500).json({ error: error.message });
    }
};

// Vérifier la validité d'un certificat
exports.verifyCertificate = async (req, res) => {
    try {
        const { certificateNumber } = req.params;

        const certificate = await Certificate.findOne({ certificateNumber })
            .populate('user', 'name lastName email')
            .populate('course', 'title')
            .populate('module', 'title');

        if (!certificate) {
            return res.status(404).json({
                valid: false,
                message: 'Certificat non trouvé'
            });
        }

        // Vérifier si le certificat est expiré
        const now = new Date();
        const isExpired = certificate.expiryDate && now > certificate.expiryDate;
        const status = isExpired ? 'expired' : certificate.status;

        res.status(200).json({
            valid: status === 'active',
            status,
            certificate: {
                number: certificate.certificateNumber,
                userName: `${certificate.user.name} ${certificate.user.lastName}`,
                courseName: certificate.course.title,
                moduleName: certificate.module.title,
                issueDate: certificate.issueDate,
                expiryDate: certificate.expiryDate
            }
        });
    } catch (error) {
        console.error('Erreur lors de la vérification du certificat:', error);
        res.status(500).json({ error: error.message });
    }
};
