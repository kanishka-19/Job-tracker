const express = require('express');
const router = express.Router({ mergeParams: true });
const { uploadResume, getResume, deleteResume } = require('../controllers/resumeController');
const authMiddleware = require('../middleware/authJWT');
const upload = require('../middleware/uploadMiddleware');
const { get } = require('mongoose');
const { resumeJobIdRules } = require('../validators/resumeValidator');
const validate = require('../middleware/validateMiddleware');
router.use(authMiddleware);

router.post('/', resumeJobIdRules, validate, upload.single('resume'), uploadResume);
router.get('/',  resumeJobIdRules, validate, getResume);
router.delete('/', resumeJobIdRules, validate, deleteResume);


module.exports = router;