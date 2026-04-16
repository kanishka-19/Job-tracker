const { body } = require('express-validator');

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotRules = [
  body('email')
    .exists({ checkNull: true, checkFalsy: true }).withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email')
    .normalizeEmail(),
];

const resetRules = [
  body('token')
    .exists({ checkNull: true, checkFalsy: true }).withMessage('Token is required')
    .isHexadecimal().withMessage('Invalid token format')
    .isLength({ min: 64, max: 64 }).withMessage('Invalid token length'),
  body('id')
    .exists({ checkNull: true, checkFalsy: true }).withMessage('User id is required')
    .isMongoId().withMessage('Invalid user id'),
  body('newPassword')
    .exists({ checkNull: true, checkFalsy: true }).withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
    .trim(),
];

const changePasswordRules = [
  // oldPassword must exist and be non-empty
  body('oldPassword')
    .exists({ checkNull: true, checkFalsy: true }).withMessage('Old password is required')
    .isLength({ min: 6 }).withMessage('Old password must be at least 6 characters'),
  // newPassword must be different from oldPassword
  body('newPassword')
    .exists({ checkNull: true, checkFalsy: true }).withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
    .custom((value, { req }) => {
      if (value === req.body.oldPassword) {
        throw new Error('New password must be different from old password');
      }
      return true;
    })
    .trim(),
];

module.exports = { loginRules, registerRules, forgotRules, resetRules, changePasswordRules };
