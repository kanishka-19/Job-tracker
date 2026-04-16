const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  updateUser,
  getUser,
  createProfile,
  deleteAvatar,
  deleteResume,
  deleteUser,
} = require('../controllers/userController');

const authMiddleware = require('../middleware/authJWT');
const upload = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validateMiddleware');
const { userUpdateRules } = require('../validators/userValidator'); // ✅ new import

// all routes require authentication
router.use(authMiddleware);

// PATCH /api/v1/user — update profile (with validation + uploads)
router.patch(
  '/',
  upload.userFields(),   // multer for files
  userUpdateRules,       // field validation
  validate,              // express-validator result handling
  updateUser
);

// GET /api/v1/user — fetch profile
router.get('/', getUser);

// POST /api/v1/user — create profile (for first-time user setup)
router.post(
  '/',
  upload.userFields(),
  userUpdateRules,
  validate,
  createProfile
);

// DELETE /api/v1/user/resume — remove resume from S3 + user record
router.delete('/resume', deleteResume);

// DELETE /api/v1/user/avatar — remove avatar from S3 + user record
router.delete('/avatar', deleteAvatar);

// DELETE /api/v1/user — cascade delete account + related jobs/resumes
router.delete('/', deleteUser);

module.exports = router;
