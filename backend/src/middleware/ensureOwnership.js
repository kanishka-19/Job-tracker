// src/middleware/ensureOwnership.js
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

/**
 * ensureOwnership(model, idSource)
 * - model: Mongoose model (e.g. Job)
 * - idSource: function to extract resource id from req (default: req.params.id)
 *
 * Usage: router.patch('/:id', auth, ensureOwnership(Job), updateJob)
 */
module.exports = function ensureOwnership(Model, idSource = (req) => req.params.id) {
  return async (req, res, next) => {
    try {
      const id = idSource(req);
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError('Invalid id', 400));
      }
      const doc = await Model.findById(id).select('createdBy');
      if (!doc) return next(new AppError('Not found', 404));
      if (!req.user || String(doc.createdBy) !== String(req.user.id)) {
        return next(new AppError('Forbidden', 403));
      }
      // attach doc if controller wants it
      req.resource = doc;
      return next();
    } catch (err) {
      return next(err);
    }
  };
};
