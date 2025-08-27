const { body, param } = require('express-validator');

exports.getNotesRules = [
  param('jobId').isMongoId().withMessage('Invalid jobId'),
];

exports.addNoteRules = [
  param('jobId').isMongoId().withMessage('Invalid jobId'),
  body('body').trim().notEmpty().withMessage('Note body is required'),
];

exports.deleteNoteRules = [
  param('jobId').isMongoId().withMessage('Invalid jobId'),
  param('noteId').isMongoId().withMessage('Invalid noteId'),
];