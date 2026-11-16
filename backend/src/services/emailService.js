const nodemailer = require("nodemailer");

const appUrl = (process.env.APP_URL || "http://localhost:5173").replace(/\/$/, "");
const emailFrom =
  process.env.EMAIL_FROM || "Smart Community <onboarding@resend.dev>";
const resendEndpoint = "https://api.resend.com/emails";
let warnedAboutMissingProvider = false;

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

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

const sendWithResend = async ({ to, subject, text, html }) => {
  if (typeof fetch !== "function") {
    throw new Error("The configured Node.js runtime does not support HTTPS email delivery.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(resendEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [to],
        subject,
        text,
        html,
      }),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const reason = payload.message || payload.name || `HTTP ${response.status}`;
      throw new Error(`Resend rejected the email request: ${reason}`);
    }

    return { delivered: true, messageId: payload.id, provider: "resend" };
  } finally {
    clearTimeout(timeout);
  }
};

const sendAuthEmail = async ({ to, subject, text, html }) => {
  if (process.env.RESEND_API_KEY) {
    try {
      return await sendWithResend({ to, subject, text, html });
    } catch (error) {
      console.error("Authentication email delivery failed (resend):", error.message);
      return { delivered: false, provider: "resend" };
    }
  }

  const transporter = createTransporter();
  if (!transporter) {
    if (!warnedAboutMissingProvider) {
      console.warn(
        "Authentication email delivery is not configured. Set RESEND_API_KEY or SMTP credentials.",
      );
      warnedAboutMissingProvider = true;
    }
    return { delivered: false, provider: "none" };
  }

  try {
    const info = await transporter.sendMail({
      from: emailFrom,
      to,
      subject,
      text,
      html,
    });
    return { delivered: true, messageId: info.messageId, provider: "smtp" };
  } catch (error) {
    console.error("Authentication email delivery failed (smtp):", error.message);
    return { delivered: false, provider: "smtp" };
  }
};

const sendVerificationEmail = async ({ email, fullName, token }) => {
  const url = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const result = await sendAuthEmail({
    to: email,
    subject: "Verify your Smart Community account",
    text: `Hello ${fullName}, verify your email by opening: ${url}`,
    html: `<p>Hello ${escapeHtml(fullName)},</p><p>Verify your email by opening this link:</p><p><a href="${url}">Verify email</a></p>`,
  });
  return { ...result, url };
};

const sendPasswordResetEmail = async ({ email, fullName, token }) => {
  const url = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const result = await sendAuthEmail({
    to: email,
    subject: "Reset your Smart Community password",
    text: `Hello ${fullName}, reset your password by opening: ${url}`,
    html: `<p>Hello ${escapeHtml(fullName)},</p><p>Reset your password by opening this link:</p><p><a href="${url}">Reset password</a></p><p>This link expires soon.</p>`,
  });
  return { ...result, url };
};

// Sent when an account signs in from a browser it has not used before.
const sendLoginAlertEmail = async ({ email, fullName, when, device, ip }) => {
  const settingsUrl = `${appUrl}/settings`;
  const resetUrl = `${appUrl}/forgot-password`;
  const name = fullName || email;
  return sendAuthEmail({
    to: email,
    subject: "New sign-in to your Smart Community account / ការចូលគណនីពីឧបករណ៍ថ្មី",
    text: [
      `Hello ${name},`,
      "",
      "Your Smart Community account was just signed in from a new device.",
      `Time: ${when}`,
      `Device: ${device}`,
      `IP address: ${ip}`,
      "",
      `If this was you, you can ignore this email. If not, reset your password now: ${resetUrl}`,
      `and turn on two-step verification in Settings: ${settingsUrl}`,
      "",
      "គណនី Smart Community របស់អ្នកទើបតែត្រូវបានចូលពីឧបករណ៍ថ្មី។ បើមិនមែនជាអ្នកទេ សូមប្តូរពាក្យសម្ងាត់ភ្លាមៗ។",
    ].join("\n"),
    html: `<p>Hello ${escapeHtml(name)},</p>
<p>Your Smart Community account was just signed in from a <strong>new device</strong>.</p>
<ul><li>Time: ${escapeHtml(when)}</li><li>Device: ${escapeHtml(device)}</li><li>IP address: ${escapeHtml(ip)}</li></ul>
<p>If this was you, you can ignore this email. If not, <a href="${resetUrl}">reset your password now</a> and turn on two-step verification in <a href="${settingsUrl}">Settings</a>.</p>
<p>គណនី Smart Community របស់អ្នកទើបតែត្រូវបានចូលពីឧបករណ៍ថ្មី។ បើមិនមែនជាអ្នកទេ សូម<a href="${resetUrl}">ប្តូរពាក្យសម្ងាត់</a>ភ្លាមៗ។</p>`,
  });
};

module.exports = {
  sendLoginAlertEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
};
