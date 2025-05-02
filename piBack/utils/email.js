const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html) => {
  // Vérifier si les identifiants d'e-mail sont configurés
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email sending is disabled or not configured properly');
    console.log(`Would have sent email to: ${to}`);
    console.log(`Subject: ${subject}`);
    // Ne pas lever d'erreur, simplement simuler l'envoi
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    // Ne pas propager l'erreur pour éviter de bloquer le flux de l'application
    // Mais enregistrer l'erreur pour le débogage
  }
};

module.exports = sendEmail;