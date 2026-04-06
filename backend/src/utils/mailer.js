const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // 587 => false
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// check SMTP connection
transporter.verify((err) => {
  if (err) {
    console.log("❌ SMTP VERIFY FAILED:", err.message);
  } else {
    console.log("✅ SMTP READY (Gmail connected)");
  }
});

// ⭐ generic email sender function
const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      html,
    });

    console.log("📧 Email sent to:", to);
  } catch (err) {
    console.log("❌ Email send failed:", err.message);
  }
};

module.exports = { transporter, sendEmail };