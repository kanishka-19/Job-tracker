// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const User = require('../models/user');

module.exports = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';

    if (!auth.startsWith('Bearer ')) {
      return next(new AppError('Unauthorized', 401));
    }

    const token = auth.split(' ')[1];
    if (!token) {
      return next(new AppError('Unauthorized', 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Token expired', 401));
      }
      return next(new AppError('Invalid token', 401));
    }

    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return next(new AppError('Invalid token payload', 401));
    }

    // Fetch user to check if password has been changed since token issuance
    const user = await User.findById(userId).select('passwordChangedAt');
    if (!user) return next(new AppError('User not found', 401));

    if (user.passwordChangedAt) {
      const pwdChangedAtSec = Math.floor(new Date(user.passwordChangedAt).getTime() / 1000);
      if (decoded.iat < pwdChangedAtSec) {
        return next(new AppError('Token has been invalidated by password change', 401));
      }
    }

    // Attach user to request
    req.user = { id: userId };
    return next();
  } catch (err) {
    return next(err);
  }
};
