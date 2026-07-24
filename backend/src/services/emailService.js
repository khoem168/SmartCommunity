const nodemailer = require("nodemailer");

const appUrl = (process.env.APP_URL || "http://localhost:5173").replace(/\/$/, "");

const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

const sendAuthEmail = async ({ to, subject, text, html }) => {
  const transporter = createTransporter();
  if (!transporter) return { delivered: false };

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "Smart Community <no-reply@smartcommunity.local>",
      to,
      subject,
      text,
      html,
    });
    return { delivered: true, messageId: info.messageId };
  } catch (error) {
    console.error("Authentication email delivery failed:", error.message);
    return { delivered: false };
  }
};

const sendVerificationEmail = async ({ email, fullName, token }) => {
  const url = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const result = await sendAuthEmail({
    to: email,
    subject: "Verify your Smart Community account",
    text: `Hello ${fullName}, verify your email by opening: ${url}`,
    html: `<p>Hello ${fullName},</p><p>Verify your email by opening this link:</p><p><a href="${url}">Verify email</a></p>`,
  });
  return { ...result, url };
};

const sendPasswordResetEmail = async ({ email, fullName, token }) => {
  const url = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const result = await sendAuthEmail({
    to: email,
    subject: "Reset your Smart Community password",
    text: `Hello ${fullName}, reset your password by opening: ${url}`,
    html: `<p>Hello ${fullName},</p><p>Reset your password by opening this link:</p><p><a href="${url}">Reset password</a></p><p>This link expires soon.</p>`,
  });
  return { ...result, url };
};

module.exports = {
  sendPasswordResetEmail,
  sendVerificationEmail,
};
