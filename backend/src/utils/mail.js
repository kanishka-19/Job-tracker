// src/utils/mail.js
const nodemailer = require('nodemailer');

let transporter = null;

async function createRealTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP not configured');
  }

  const t = nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    // timeouts to fail fast on network issues
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });

  // verify connection (will throw on ECONNREFUSED/timeouts)
  await t.verify();
  return t;
}

async function createEtherealTransporter() {
  const testAccount = await nodemailer.createTestAccount();
  console.warn('Using Ethereal test account (dev). Preview URLs will be logged.');
  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.NODE_ENV === 'production') {
    // In production, never fall back — fail loudly if SMTP is misconfigured
    transporter = await createRealTransporter();
    console.log('Mail: connected to real SMTP:', process.env.SMTP_HOST);
  } else {
    // In development, try real SMTP first, fall back to Ethereal
    try {
      transporter = await createRealTransporter();
      console.log('Mail: connected to real SMTP:', process.env.SMTP_HOST);
    } catch (err) {
      console.warn('Mail: real SMTP failed, falling back to Ethereal. Error:', err.message);
      transporter = await createEtherealTransporter();
    }
  }

  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  const t = await getTransporter();
  const from = process.env.EMAIL_FROM || 'no-reply@example.com';

  const info = await t.sendMail({ from, to, subject, text, html });

  // If Ethereal (or other test provider) returns a preview URL, log it
  try {
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log('Preview URL:', preview);
  } catch (_) {}

  if (process.env.NODE_ENV !== 'production') {
    try { console.log('Mail sent info id:', info.messageId); } catch (_) {}
  }

  return info;
}

module.exports = { sendEmail };
