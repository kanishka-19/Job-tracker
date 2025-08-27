// validators/jobValidators.js
const { body, param, query } = require('express-validator');
const STATUS = ['applied', 'pending', 'interview', 'rejected'];

exports.createJobRules = [
  body('company').trim().notEmpty().withMessage('Company is required'),
  body('position').trim().notEmpty().withMessage('Position is required'),
  body('status').optional().isIn(STATUS).withMessage('Invalid status'),
];

exports.updateJobRules = [
  param('id').isMongoId().withMessage('Invalid jobId'),
  body('company').optional().notEmpty().withMessage('Company cannot be empty'),
  body('position').optional().notEmpty().withMessage('Position cannot be empty'),
  body('status').optional().isIn(STATUS).withMessage('Invalid status'),
];

// ✅ GET /api/v1/jobs/:id
exports.jobIdParam = [
  param('id').isMongoId().withMessage('Invalid jobId'),
];

// ✅ GET /api/v1/jobs?status=pending&page=1&limit=10&sort=-createdAt
exports.listJobsRules = [
  query('status')
    .optional()
    .isIn(STATUS)
    .withMessage('Invalid status'),
  query('company')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Company must be a non-empty string'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be an integer ≥ 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isString()
    .withMessage('sort must be a string'),
];
