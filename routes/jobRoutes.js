const express = require('express');
const { createJob, getJobs, getJobById, updateJob, deleteJob } = require('../controllers/jobController');
const { createJobRules, updateJobRules, jobIdParam, listJobsRules} = require('../validators/jobValidator');
const validate = require('../middleware/validateMiddleware');
const authMiddleware = require('../middleware/authJWT');

const router = express.Router();
router.use(authMiddleware);

router.get('/', listJobsRules, validate, getJobs);

router.post('/', createJobRules, validate, createJob);

router.get('/:id', jobIdParam, validate, getJobById);

router.patch('/:id', updateJobRules, validate, updateJob);

router.delete('/:id', jobIdParam, validate, deleteJob);

module.exports = router;
