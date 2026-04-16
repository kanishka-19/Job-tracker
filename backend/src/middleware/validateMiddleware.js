const { validationResult } = require('express-validator');

module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const err = new Error('Validation failed');
  err.statusCode = 422;
  err.errors = result.array().map(e => ({ field: e.param, msg: e.msg }));
  return next(err);
};