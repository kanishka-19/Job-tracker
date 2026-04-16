// src/middleware/uploadMiddleware.js
const multer = require('multer');
const AppError = require('../utils/AppError');

// memory storage so controllers can upload buffer -> S3
const storage = multer.memoryStorage();

// limits in bytes
const LIMITS = {
  resume: 5 * 1024 * 1024, // 5 MB
  avatar: 2 * 1024 * 1024, // 2 MB
};

// allowed MIME types
const ALLOWED = {
  resume: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream',
  ],
  avatar: [
    'image/jpeg',
    'image/png',
    'image/webp',
  ],
};

function fileFilter(req, file, cb) {
  const field = file.fieldname;
  if (field === 'resume') {
    if (!ALLOWED.resume.includes(file.mimetype)) {
      return cb(new AppError('Resume must be PDF or DOC/DOCX', 400), false);
    }
    return cb(null, true);
  }
  if (field === 'avatar') {
    if (!ALLOWED.avatar.includes(file.mimetype)) {
      return cb(new AppError('Avatar must be JPG/PNG/WEBP', 400), false);
    }
    return cb(null, true);
  }
  return cb(new AppError('Unexpected file field'), false);
}

// create multer instance (default export)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: Math.max(LIMITS.resume, LIMITS.avatar), files: 2 },
});

// helper wrapper to enforce per-field size limits and give better errors
function fieldsMiddleware(fieldsArray) {
  const middleware = upload.fields(fieldsArray);
  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (err) return next(err);

      const files = req.files || {};
      try {
        if (files.resume && files.resume[0]) {
          const f = files.resume[0];
          if (f.size > LIMITS.resume) throw new AppError('Resume file size must be <= 5MB', 400);
        }
        if (files.avatar && files.avatar[0]) {
          const f = files.avatar[0];
          if (f.size > LIMITS.avatar) throw new AppError('Avatar file size must be <= 2MB', 400);
        }
      } catch (e) {
        return next(e);
      }

      return next();
    });
  };
}

// attach helper to multer instance so both patterns work:
// - upload.single(...) (existing code)
// - upload.userFields() (new validation-aware helper)
upload.userFields = () => fieldsMiddleware([{ name: 'resume', maxCount: 1 }, { name: 'avatar', maxCount: 1 }]);

module.exports = upload;
