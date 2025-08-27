// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

module.exports = (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';

    if (!auth.startsWith('Bearer ')) {
      return next(new AppError('Unauthorized', 401));
    }

    const token = auth.split(' ')[1];
    if (!token) {
      return next(new AppError('Unauthorized', 401));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // keep shape consistent with controllers
      req.user = { id: decoded.userId || decoded.id };
      if (!req.user.id) return next(new AppError('Invalid token payload', 401));
      return next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Token expired', 401));
      }
      return next(new AppError('Invalid token', 401));
    }
  } catch (err) {
    return next(err);
  }
};
