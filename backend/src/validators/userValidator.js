// src/validators/userValidator.js
const { body } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

const ALLOWED = ['name', 'headline', 'location', 'bio', 'resumeKey', 'avatarKey', 'links'];

const sanitize = (value) => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });

const userUpdateRules = [
  body('name').optional().isString().trim().isLength({ max: 100 }).withMessage('Name max 100 chars')
    .customSanitizer(sanitize),
  body('headline').optional().isString().trim().isLength({ max: 120 }).withMessage('Headline max 120 chars')
    .customSanitizer(sanitize),
  body('location').optional().isString().trim().isLength({ max: 100 }).withMessage('Location max 100 chars')
    .customSanitizer(sanitize),
  body('bio').optional().isString().trim().isLength({ max: 1000 }).withMessage('Bio max 1000 chars')
    .customSanitizer(sanitize),

  body('resumeKey').optional().custom(v => v === null || typeof v === 'string'),
  body('avatarKey').optional().custom(v => v === null || typeof v === 'string'),

  body().custom((_, { req }) => {
    const keys = Object.keys(req.body || {});
    const unexpected = keys.filter(k => !ALLOWED.includes(k));
    if (unexpected.length) throw new Error('Unexpected field(s): ' + unexpected.join(', '));
    return true;
  }),
];

module.exports = { userUpdateRules };
