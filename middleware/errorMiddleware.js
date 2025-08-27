// Centralized error handler
module.exports = (err, req, res, next) => {
  // Default status/message
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errors = err.errors;

  // Common mappings
  if (err.name === 'ValidationError') {
    status = 422;
    message = 'Validation failed';
    errors = Object.values(err.errors).map(e => ({ field: e.path, msg: e.message }));
  }

  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
  }

  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    message = `Duplicate value for ${field}`;
  }

  // JWT
  if (err.name === 'JsonWebTokenError') {
    status = 401; message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    status = 401; message = 'Token expired';
  }

  // Body parser JSON error
  if (err.type === 'entity.parse.failed') {
    status = 400; message = 'Invalid JSON payload';
  }

  // Multer file errors
  if (err.name === 'MulterError') {
    status = 400; message = err.message || 'File upload error';
  }

  // Log once (you can gate by NODE_ENV)
  console.error(err);
console.log('NODE_ENV =', process.env.NODE_ENV);
  res.status(status).json({
    message,
    errors,
    code: err.code || undefined,
    // stack only in dev:
    
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
