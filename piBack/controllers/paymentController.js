const stripe = require('../config/stripe');
const Payment = require('../Model/Payment');
const Course = require('../Model/Course');
const User = require('../Model/User');

// Créer une intention de paiement
const createPaymentIntent = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.user.id;

        // Vérifier si le cours existe
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Cours non trouvé' });
        }

        // Vérifier si l'utilisateur a déjà acheté ce cours
        if (course.purchasedBy.includes(userId)) {
            return res.status(400).json({ error: 'Vous avez déjà acheté ce cours' });
        }

        // Créer l'intention de paiement dans Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: course.price * 100, // Convertir en centimes (Stripe utilise la plus petite unité monétaire)
            currency: 'usd', // USD comme devise temporaire (Stripe pourrait ne pas prendre en charge TND)
            metadata: {
                courseId: courseId.toString(),
                userId: userId.toString()
            }
        });

        // Créer un enregistrement de paiement dans notre base de données
        const payment = new Payment({
            user: userId,
            course: courseId,
            amount: course.price,
            stripePaymentIntentId: paymentIntent.id,
            status: 'pending'
        });
        await payment.save();

        // Retourner le client secret pour compléter le paiement côté client
        res.json({
            clientSecret: paymentIntent.client_secret,
            courseId,
            amount: course.price
        });
    } catch (error) {
        console.error('Erreur lors de la création de l\'intention de paiement:', error);
        res.status(500).json({ error: error.message });
    }
};

// Confirmer un paiement réussi
const confirmPayment = async (req, res) => {
    try {
        const { paymentIntentId } = req.body;
        const userId = req.user.id;

        // Récupérer l'intention de paiement depuis Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ error: 'Le paiement n\'a pas été complété' });
        }

        // Mettre à jour le statut du paiement dans notre base de données
        const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
        if (!payment) {
            return res.status(404).json({ error: 'Paiement non trouvé' });
        }

        payment.status = 'succeeded';
        await payment.save();

        // Ajouter le cours à la liste des cours achetés par l'utilisateur
        const courseId = paymentIntent.metadata.courseId;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Cours non trouvé' });
        }

        // Ajouter l'utilisateur à la liste des acheteurs du cours
        if (!course.purchasedBy.includes(userId)) {
            course.purchasedBy.push(userId);
            await course.save();
        }

        // Ajouter le cours aux cours inscrits de l'utilisateur
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Vérifier si l'utilisateur est déjà inscrit à ce cours
        const enrolledCourseIndex = user.enrolledCourses.findIndex(
            enrolledCourse => enrolledCourse.courseId.toString() === courseId
        );

        if (enrolledCourseIndex === -1) {
            user.enrolledCourses.push({
                courseId: courseId,
                progress: 0,
                timeSpent: 0,
                quizzesCompleted: 0
            });
            await user.save();
        }

        res.json({ 
            success: true, 
            message: 'Paiement confirmé avec succès',
            courseId
        });
    } catch (error) {
        console.error('Erreur lors de la confirmation du paiement:', error);
        res.status(500).json({ error: error.message });
    }
};

// Webhook pour recevoir les événements de Stripe
const webhookHandler = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error(`Erreur de signature webhook: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Gérer les événements spécifiques
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        
        // Mettre à jour le statut du paiement dans notre base de données
        try {
            const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
            if (payment) {
                payment.status = 'succeeded';
                await payment.save();

                // Ajouter le cours à la liste des cours achetés par l'utilisateur
                const courseId = paymentIntent.metadata.courseId;
                const userId = paymentIntent.metadata.userId;

                const course = await Course.findById(courseId);
                if (course && !course.purchasedBy.includes(userId)) {
                    course.purchasedBy.push(userId);
                    await course.save();
                }

                // Ajouter le cours aux cours inscrits de l'utilisateur
                const user = await User.findById(userId);
                if (user) {
                    const enrolledCourseIndex = user.enrolledCourses.findIndex(
                        enrolledCourse => enrolledCourse.courseId.toString() === courseId
                    );

                    if (enrolledCourseIndex === -1) {
                        user.enrolledCourses.push({
                            courseId: courseId,
                            progress: 0,
                            timeSpent: 0,
                            quizzesCompleted: 0
                        });
                        await user.save();
                    }
                }
            }
        } catch (error) {
            console.error('Erreur lors du traitement du webhook:', error);
        }
    } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        
        try {
            const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
            if (payment) {
                payment.status = 'failed';
                await payment.save();
            }
        } catch (error) {
            console.error('Erreur lors du traitement du webhook de paiement échoué:', error);
        }
    }

    // Renvoyer une réponse de succès
    res.json({ received: true });
};

// Obtenir l'historique des paiements d'un utilisateur
const getUserPayments = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const payments = await Payment.find({ user: userId })
            .populate('course', 'title description price')
            .sort({ createdAt: -1 });
            
        res.json(payments);
    } catch (error) {
        console.error('Erreur lors de la récupération des paiements:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createPaymentIntent,
    confirmPayment,
    webhookHandler,
    getUserPayments
};
