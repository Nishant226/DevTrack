const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // 1. Transporter create karna (Mail Server Connection)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT, 10) || 465,
      secure: true, // Port 465 ke liye true hota hai
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // 2. Email details prepare karna
    const mailOptions = {
      from: `DevTrack Pro <${process.env.SMTP_MAIL}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html, // Agar HTML template bhejni ho
    };

    // 3. Email send karna
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Detailed Nodemailer Error:', error);
    throw error; // Task create flow ko crash nahi karega kyunki task controller mein try/catch hai
  }
};

module.exports = sendEmail;