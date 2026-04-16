// scripts/test-email.js
const nodemailer = require('nodemailer');

async function main() {
  // Create ethereal test account (only for dev; console shows credentials + preview URL)
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });

  const info = await transporter.sendMail({
    from: '"Job Tracker" <no-reply@example.com>',
    to: 'your.email@example.com',
    subject: 'Test email from Job Tracker',
    text: 'This is a test',
    html: '<b>This is a test</b>',
  });

  console.log('MessageId:', info.messageId);
  console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
}

main().catch(console.error);
