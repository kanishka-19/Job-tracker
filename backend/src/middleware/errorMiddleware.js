// src/middleware/errorMiddleware.js
const AppError = require('../utils/AppError');

module.exports = (err, req, res, next) => {
  // Default values
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errors = err.errors || null;
  let code = err.code || null;

  // Common mappings (keep existing logic, but normalize)
  if (err.name === 'ValidationError') {
    status = 422;
    message = 'Validation failed';
    errors = Object.values(err.errors || {}).map(e => ({ field: e.path, msg: e.message }));
    code = code || 'VALIDATION_ERROR';
  }

  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path || 'id'}`;
    code = code || 'INVALID_ID';
  }

  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    message = `Duplicate value for ${field}`;
    code = code || 'DUPLICATE_KEY';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
    code = code || 'UNAUTHORIZED';
  }
  if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
    code = code || 'TOKEN_EXPIRED';
  }

  // Body parser JSON error
  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON payload';
    code = code || 'INVALID_JSON';
  }

  // Multer file errors
  if (err.name === 'MulterError') {
    status = 400;
    message = err.message || 'File upload error';
    code = code || 'FILE_UPLOAD_ERROR';
  }

  // If it's an AppError and carries a code/status, prefer those
  if (err instanceof AppError) {
    status = err.statusCode || status;
    message = err.message || message;
    errors = err.errors || errors;
    code = err.code || code;
  }

  // Default code mapping for common statuses if code still missing
  if (!code) {
    if (status === 401) code = 'UNAUTHORIZED';
    else if (status === 403) code = 'FORBIDDEN';
    else if (status === 404) code = 'NOT_FOUND';
    else if (status >= 500) code = 'INTERNAL_ERROR';
    else code = 'ERROR';
  }

  // Logging: more verbose in development, and log stack only for server errors
  const isDev = process.env.NODE_ENV === 'development';
  if (status >= 500) {
    console.error('Server Error:', err);
  } else if (isDev) {
    console.warn('Warning/Error:', err);
  }

  // Build response body
  const body = {
    status,
    message,
    errors,
    code,
  };

  if (isDev) {
    body.stack = err.stack;
  }

  res.status(status).json(body);
};
