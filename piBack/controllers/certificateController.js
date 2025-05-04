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
    console.log("=== DÉBUT DE LA GÉNÉRATION DU CERTIFICAT ===");
    console.log("- userId:", userId);
    console.log("- quizId:", quizId);
    console.log("- score:", score);
    console.log("- percentage:", percentage);

    try {
        // Vérifier si les IDs sont valides
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.error("ID utilisateur invalide:", userId);
            throw new Error('ID utilisateur invalide');
        }

        if (!mongoose.Types.ObjectId.isValid(quizId)) {
            console.error("ID quiz invalide:", quizId);
            throw new Error('ID quiz invalide');
        }

        // Vérifier si l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            console.error("Utilisateur non trouvé avec l'ID:", userId);
            throw new Error('Utilisateur non trouvé');
        }
        console.log("Utilisateur trouvé:", user.name, user.lastName);

        // Vérifier si le quiz est un quiz final
        const quiz = await Quiz.findById(quizId);
        console.log("Quiz trouvé:", quiz ? "Oui" : "Non");

        // Vérifier si le quiz existe
        if (!quiz) {
            console.error("Quiz non trouvé avec l'ID:", quizId);
            throw new Error('Quiz non trouvé');
        }

        console.log("Détails du quiz:", {
            id: quiz._id,
            title: quiz.title,
            isFinalQuiz: quiz.isFinalQuiz,
            courseId: quiz.course
        });

        // Vérifier si le quiz est final
        if (!quiz.isFinalQuiz) {
            console.error("Ce quiz n'est pas un quiz final. Quiz ID:", quizId);
            throw new Error('Ce quiz n\'est pas un quiz final');
        }

        // Vérifier si le quiz a un cours associé
        if (!quiz.course) {
            console.error("Ce quiz n'a pas de cours associé. Quiz ID:", quizId);
            throw new Error('Ce quiz n\'a pas de cours associé');
        }

        // Récupérer les informations du cours
        console.log("Recherche du cours avec ID:", quiz.course);
        const course = await Course.findById(quiz.course);
        console.log("Cours trouvé:", course ? "Oui" : "Non");

        // Vérifier si le cours existe
        if (!course) {
            console.error("Cours non trouvé pour le quiz. Course ID:", quiz.course);
            throw new Error('Cours non trouvé');
        }

        console.log("Détails du cours:", {
            id: course._id,
            title: course.title,
            moduleId: course.module
        });

        // Récupérer les informations du module
        let module = null;
        if (course.module) {
            console.log("Recherche du module avec ID:", course.module);
            module = await Module.findById(course.module);
            console.log("Module trouvé:", module ? "Oui" : "Non");

            if (module) {
                console.log("Détails du module:", {
                    id: module._id,
                    title: module.title
                });
            }
        } else {
            console.log("Aucun module associé au cours");
        }

        // Créer un module par défaut si nécessaire
        if (!module) {
            console.log("Création d'un module par défaut pour le certificat");
            module = {
                _id: new mongoose.Types.ObjectId(),
                title: "Module par défaut"
            };
        }

        // Vérifier si un certificat existe déjà
        console.log("Vérification de l'existence d'un certificat pour user:", userId, "et quiz:", quizId);
        const existingCertificate = await Certificate.findOne({
            user: userId,
            quiz: quizId
        });

        if (existingCertificate) {
            console.log("Certificat existant trouvé, ID:", existingCertificate._id);
            return existingCertificate;
        }

        console.log("Aucun certificat existant trouvé, création d'un nouveau certificat");

        // Générer un numéro de certificat unique
        const certificateNumber = Certificate.generateCertificateNumber();
        console.log("Numéro de certificat généré:", certificateNumber);

        // Calculer la date d'expiration (1 an après la date d'émission)
        const issueDate = new Date();
        const expiryDate = new Date(issueDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        console.log("Date d'émission:", issueDate);
        console.log("Date d'expiration:", expiryDate);

        // Créer le certificat
        const certificateData = {
            user: userId,
            quiz: quizId,
            course: course._id,
            score,
            percentage,
            certificateNumber,
            issueDate,
            expiryDate,
            status: 'active'
        };

        // Ajouter le module s'il existe
        if (module && module._id) {
            certificateData.module = module._id;
        }

        console.log("Création du certificat avec les données:", JSON.stringify(certificateData, null, 2));

        try {
            const certificate = new Certificate(certificateData);
            console.log("Tentative de sauvegarde du certificat");
            await certificate.save();
            console.log("Certificat sauvegardé avec succès, ID:", certificate._id);

            // Créer le répertoire pour les certificats s'il n'existe pas
            const certificatesDir = path.join(__dirname, '..', 'uploads', 'certificates');
            if (!fs.existsSync(certificatesDir)) {
                console.log("Création du répertoire certificates:", certificatesDir);
                fs.mkdirSync(certificatesDir, { recursive: true });
                console.log("Répertoire certificates créé avec succès");
            }

            console.log("=== FIN DE LA GÉNÉRATION DU CERTIFICAT ===");
            return certificate;
        } catch (saveError) {
            console.error("Erreur lors de la sauvegarde du certificat:", saveError);
            throw new Error(`Erreur lors de la sauvegarde du certificat: ${saveError.message}`);
        }
    } catch (error) {
        console.error('=== ERREUR LORS DE LA GÉNÉRATION DU CERTIFICAT ===');
        console.error(error);
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
        console.log("Début de la génération du PDF du certificat");
        const { certificateId } = req.params;
        console.log("ID du certificat:", certificateId);

        if (!mongoose.Types.ObjectId.isValid(certificateId)) {
            console.error("ID de certificat invalide:", certificateId);
            return res.status(400).json({ error: 'ID de certificat invalide' });
        }

        // Vérifier si le certificat existe
        const certificate = await Certificate.findById(certificateId)
            .populate('user', 'name lastName email')
            .populate('course', 'title')
            .populate('module', 'title')
            .populate('quiz', 'title');

        console.log("Certificat trouvé:", certificate ? "Oui" : "Non");

        if (!certificate) {
            console.error("Certificat non trouvé avec l'ID:", certificateId);
            return res.status(404).json({ error: 'Certificat non trouvé' });
        }

        // Vérifier que l'utilisateur est autorisé à voir ce certificat
        if (certificate.user._id.toString() !== req.user._id.toString() && req.user.typeUser !== 'admin') {
            console.error("Accès non autorisé au certificat. User ID:", req.user._id, "Certificate User ID:", certificate.user._id);
            return res.status(403).json({ error: 'Non autorisé à accéder à ce certificat' });
        }

        console.log("Création du document PDF...");

        // Créer un document PDF
        const doc = new PDFDocument({
            size: 'A4',
            layout: 'landscape',
            margin: 50
        });

        // Définir le nom du fichier
        const fileName = `certificate-${certificate.certificateNumber}.pdf`;
        const certificatesDir = path.join(__dirname, '..', 'uploads', 'certificates');
        const filePath = path.join(certificatesDir, fileName);

        console.log("Chemin du fichier PDF:", filePath);

        // Assurer que le répertoire existe
        if (!fs.existsSync(certificatesDir)) {
            console.log("Création du répertoire certificates:", certificatesDir);
            try {
                fs.mkdirSync(certificatesDir, { recursive: true });
                console.log("Répertoire certificates créé avec succès");
            } catch (mkdirError) {
                console.error("Erreur lors de la création du répertoire certificates:", mkdirError);
                throw new Error(`Impossible de créer le répertoire certificates: ${mkdirError.message}`);
            }
        }

        // Vérifier les permissions du répertoire
        try {
            fs.accessSync(certificatesDir, fs.constants.W_OK);
            console.log("Permissions d'écriture OK pour le répertoire certificates");
        } catch (accessError) {
            console.error("Erreur de permission sur le répertoire certificates:", accessError);
            throw new Error(`Problème de permission sur le répertoire certificates: ${accessError.message}`);
        }

        // Pipe le PDF vers un fichier et la réponse
        console.log("Création du flux d'écriture pour le fichier PDF");
        const stream = fs.createWriteStream(filePath);

        // Gérer les erreurs de flux
        stream.on('error', (streamError) => {
            console.error("Erreur lors de l'écriture du fichier PDF:", streamError);
            if (!res.headersSent) {
                res.status(500).json({ error: `Erreur lors de l'écriture du fichier PDF: ${streamError.message}` });
            }
        });

        doc.pipe(stream);

        // Configurer les en-têtes de réponse
        console.log("Configuration des en-têtes de réponse");
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        doc.pipe(res);

        console.log("Génération du contenu du PDF...");

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

        // Vérifier si module et course existent
        let courseModuleText = '';
        if (certificate.module && certificate.module.title && certificate.course && certificate.course.title) {
            courseModuleText = `${certificate.module.title}: ${certificate.course.title}`;
        } else if (certificate.course && certificate.course.title) {
            courseModuleText = certificate.course.title;
        } else {
            courseModuleText = "le cours";
        }

        doc.font('Helvetica-Bold')
           .fontSize(20)
           .fillColor('#1E88E5')
           .text(courseModuleText, { align: 'center' })
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

        console.log("Finalisation du PDF...");

        // Finaliser le PDF
        doc.end();

        // Attendre que le fichier soit écrit
        stream.on('finish', () => {
            console.log(`Certificat PDF généré avec succès: ${filePath}`);
        });

        console.log("Génération du PDF terminée");

    } catch (error) {
        console.error('Erreur détaillée lors de la génération du PDF:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        }
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

// Vérifier si un utilisateur a déjà un certificat pour un quiz donné
exports.checkUserCertificateForQuiz = async (req, res) => {
    try {
        const userId = req.user._id;
        const { quizId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(quizId)) {
            return res.status(400).json({ error: 'ID de quiz invalide' });
        }

        const certificate = await Certificate.findOne({
            user: userId,
            quiz: quizId
        });

        res.status(200).json({
            hasCertificate: !!certificate,
            certificateId: certificate ? certificate._id : null
        });
    } catch (error) {
        console.error('Erreur lors de la vérification du certificat pour le quiz:', error);
        res.status(500).json({ error: error.message });
    }
};
