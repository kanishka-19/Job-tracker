const { param } = require('express-validator');

exports.resumeJobIdRules = [
  param('jobId').isMongoId().withMessage('Invalid jobId'),
];