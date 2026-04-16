// src/utils/verification.js
const crypto = require('crypto');
const { sendEmail } = require('./mail');

async function sendVerificationEmail(user) {
  const token = crypto.randomBytes(32).toString('hex');
  user.verifyTokenHash = crypto.createHash('sha256').update(token).digest('hex');
  user.verifyTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24h
  await user.save();

  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}&id=${user._id}`;
  const subject = 'Verify your Job Tracker account';
  const html = `<p>Welcome — click to verify:</p><a href="${verifyUrl}">${verifyUrl}</a>`;
  await sendEmail({ to: user.email, subject, html, text: verifyUrl });

  // return token for dev-use (optional)
  return token;
}

module.exports = { sendVerificationEmail };
