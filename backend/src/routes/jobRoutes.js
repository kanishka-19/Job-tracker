const express = require('express');
const { createJob, getJobs, getJobById, updateJob, deleteJob, addInterview, getInterviews } = require('../controllers/jobController');
const { createJobRules, updateJobRules, jobIdParam, listJobsRules} = require('../validators/jobValidator');
const validate = require('../middleware/validateMiddleware');
const authMiddleware = require('../middleware/authJWT');
const Job= require('../models/job');
const ensureOwnership = require('../middleware/ensureOwnership');
const router = express.Router();
router.use(authMiddleware);

router.get('/', listJobsRules, validate, getJobs);

router.post('/', createJobRules, validate, createJob);

router.get('/:id', jobIdParam, validate, ensureOwnership(Job), getJobById);

router.patch('/:id', updateJobRules, validate, ensureOwnership(Job), updateJob);

router.delete('/:id', jobIdParam, validate, ensureOwnership(Job), deleteJob);

router.post('/:id/interviews', authMiddleware, addInterview);

router.get('/:id/interviews', authMiddleware, getInterviews);
module.exports = router;
