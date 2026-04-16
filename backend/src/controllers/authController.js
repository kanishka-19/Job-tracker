// controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const AppError = require('../utils/AppError');
const { sendVerificationEmail } = require('../utils/verification');
const { sendEmail } = require('../utils/mail');
const { Types } = require('mongoose');
const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN, // e.g. "1d"
  });
const { createHash, randomBytes } = require('crypto');

const verifyEmail = async (req, res, next) => {
  try {
    const { token, id } = req.query;
    if (!token || !id) return next(new AppError('Invalid verification link', 400));

    const hashed = createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      _id: id,
      verifyTokenHash: hashed,
      verifyTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('Verification link invalid or expired', 400));
    }

    user.verifyTokenHash = undefined;
    user.verifyTokenExpires = undefined;
    user.isVerified = true; // add this field to schema if not there
    await user.save();

    res.json({ message: 'Email verified successfully!' });
  } catch (err) {
    next(err);
  }
};
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required', 400);
    }

    // optional: basic length check
    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    // hash
    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hash,
    });

    // Generate token
    const confirmToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    user.emailConfirmToken = confirmToken;
    user.emailConfirmed = false;
    await user.save();

    // Send confirmation email
    const confirmUrl = `${process.env.FRONTEND_URL}/confirm-email?token=${confirmToken}&id=${user._id}`;
    await sendEmail({
      to: user.email,
      subject: "Confirm your email",
      html: `<p>Click <a href="${confirmUrl}">here</a> to confirm your email.</p>`
    });

    res.status(201).json({ message: "Registration successful. Please check your email to confirm your account." });
  } catch (err) {
    // duplicate email -> 11000 handled by errorMiddleware too, but we can set friendlier msg
    if (err && err.code === 11000) {
      return next(new AppError('Email already in use', 409));
    }
    return next(err);
  }
};

// POST /api/v1/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    // Avoid user enumeration: respond 401 for both cases
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.emailConfirmed) {
      // Generate a new token (or reuse existing)
      const confirmToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
      user.emailConfirmToken = confirmToken;
      await user.save();

      // Send confirmation email
      const confirmUrl = `${process.env.FRONTEND_URL}/confirm-email?token=${confirmToken}&id=${user._id}`;
      await sendEmail({
        to: user.email,
        subject: "Confirm your email",
        html: `<p>Click <a href="${confirmUrl}">here</a> to confirm your email.</p>`
      });

      return next(new AppError("Please confirm your email. A new confirmation email has been sent.", 400));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = signToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken: token,
    });
  } catch (err) {
    return next(err);
  }
};
const resendVerify = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next(new AppError('Email required', 400));
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return next(new AppError('No account with that email', 404));
    if (user.isVerified) return res.json({ message: 'Already verified' });

    // sendVerificationEmail creates & saves hashed token on user
    await sendVerificationEmail(user);
    res.json({ message: 'Verification email sent' });
  } catch (err) { next(err); }
};
// --- FORGOT ---
/**
 * POST /api/v1/auth/forgot
 * Body: { email }
 * Always respond 200 (avoid account enumeration). If user exists -> create reset token, save hashed token+expiry and email link.
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next(new AppError('Email is required', 400));

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always respond success to client to avoid enumeration, but only create token/send if user exists.
    if (!user) {
      return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    // create token
    const token = randomBytes(32).toString('hex');
    const hashed = createHash('sha256').update(token).digest('hex');

    // set on user
    user.resetPasswordTokenHash = hashed;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // build reset url — frontend will call backend reset endpoint (token + id)
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}&id=${user._id}`;
    const subject = 'Reset your Job Tracker password';
    const html = `
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `;

    // send email (do not throw to client on send failure)
    try {
      await sendEmail({ to: user.email, subject, html, text: resetUrl });
    } catch (e) {
      console.error('forgotPassword: email send failed', e);
      // don't reveal to client; token remains stored (you may delete if you want)
    }

    return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};

// --- RESET ---
/**
 * POST /api/v1/auth/reset
 * Body: { token, id, newPassword }
 * Verifies hashed token + expiry, updates password (bcrypt), clears token fields, returns success (optionally issue JWT).
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, id, newPassword } = req.body;
    if (!token || !id || !newPassword) return next(new AppError('token, id and newPassword are required', 400));
    if (newPassword.length < 6) return next(new AppError('Password must be at least 6 characters', 400));

    const hashed = createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      _id: id,
      resetPasswordTokenHash: hashed,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) return next(new AppError('Reset token invalid or expired', 400));

    // update password
    user.password = await bcrypt.hash(newPassword, 10);

    user.passwordChangedAt = Date.now();
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // send confirmation email (best-effort)
    try {
      await sendEmail({
        to: user.email,
        subject: 'Your password was changed',
        html: `<p>Your Job Tracker password was just changed. If this wasn't you, please contact support immediately.</p>`,
        text: 'Your Job Tracker password was recently changed. If this wasn’t you, please contact support.',
      }); 
    } catch (e) { /* ignore email errors */ }
    // optionally auto-login: create JWT
    const jwtToken = signToken(user._id);

    res.json({ message: 'Password reset successful', accessToken: jwtToken });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return next(new AppError('oldPassword and newPassword required', 400));
    if (newPassword.length < 6) return next(new AppError('New password must be at least 6 characters', 400));

    const user = await User.findById(userId).select('+password');
    if (!user) return next(new AppError('User not found', 404));

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) return next(new AppError('Old password is incorrect', 400));

    // optional: check newPassword != oldPassword
    const sameAsOld = await bcrypt.compare(newPassword, user.password);
    if (sameAsOld) return next(new AppError('New password must be different from the old password', 400));

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordChangedAt = Date.now();
    // clear any existing reset tokens for safety
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // optional: send confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Your password was changed',
        text: 'Your Job Tracker password was recently changed. If this wasn’t you, please contact support.',
      });
    } catch (e) { /* ignore email errors */ }

    // optionally issue new JWT (choose your UX)
    const accessToken = signToken(user._id);

    return res.json({ message: 'Password changed successfully', accessToken });
  } catch (err) {
    next(err);
  }
};

const confirmEmail = async (req, res, next) => {
  const { id, token } = req.body;
  const user = await User.findById(id);
  if (!user || user.emailConfirmed) return next(new AppError("Invalid or already confirmed.", 400));
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    user.emailConfirmed = true;
    user.emailConfirmToken = undefined;
    await user.save();
    res.json({ message: "Email confirmed. You can now log in." });
  } catch (err) {
    return next(new AppError("Invalid or expired token.", 400));
  }
};

module.exports = {
  // existing exports...
  register,
  login,
  verifyEmail,
  resendVerify,
  forgotPassword,
  resetPassword,
  changePassword,
  confirmEmail
};
