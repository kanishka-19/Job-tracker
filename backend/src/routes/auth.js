const express = require('express');
const { register, login, verifyEmail, resendVerify, forgotPassword, resetPassword, changePassword, confirmEmail} = require('../controllers/authController');
const { registerRules, loginRules, forgotRules, resetRules, changePasswordRules } = require('../validators/authValidator');
const validate = require('../middleware/validateMiddleware');
const { verify } = require('jsonwebtoken');
const authMiddleware = require('../middleware/authJWT');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// limit for forgot (e.g., 6 requests per hour per IP)
const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 6,
  message: { message: 'Too many password reset requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// limit for reset endpoint (prevent brute-force token tries) — lower
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: { message: 'Too many attempts, try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.get('/verify-email', verifyEmail);
router.post('/resend-verify', resendVerify);
router.post('/forgot',forgotLimiter, forgotRules, validate, forgotPassword);
router.post('/reset',  resetLimiter, resetRules,  validate, resetPassword);
router.post('/change-password', authMiddleware, changePasswordRules, validate, changePassword);
router.post('/confirm-email', confirmEmail);
module.exports = router;
