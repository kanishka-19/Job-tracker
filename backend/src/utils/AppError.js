// utils/AppError.js
class AppError extends Error {
  constructor(message, statusCode = 400, errors = null, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code || this.defaultCode(statusCode);
  }

  defaultCode(status) {
    const map = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      500: 'INTERNAL_SERVER_ERROR'
    };
    return map[status] || 'ERROR';
  }
}
module.exports = AppError;
