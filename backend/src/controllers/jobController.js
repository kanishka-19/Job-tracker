// controllers/jobsController.js
const mongoose = require('mongoose');
const Job = require('../models/job');
const AppError = require('../utils/AppError');

const ALLOWED_STATUS = ['applied', 'pending', 'interview', 'rejected'];

// POST /api/v1/jobs
const createJob = async (req, res, next) => {
  try {
    const { company, position, status } = req.body;

    if (!company || !position) {
      throw new AppError('Company and position are required', 400);
    }
    if (status && !ALLOWED_STATUS.includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const job = await Job.create({
      company: company.trim(),
      position: position.trim(),
      status: status || 'pending',
      createdBy: req.user.id,
    });

    res.status(201).json(job);
  } catch (err) {
    next(err); // let errorMiddleware format it
  }
};

// GET /api/v1/jobs
const getJobs = async (req, res, next) => {
  try {
    const { status, company, sort, page, limit } = req.query;

    const queryObject = { createdBy: req.user.id };

    if (status && status !== "all") {
      if (!ALLOWED_STATUS.includes(status)) {
        throw new AppError('Invalid status filter', 400);
      }
      queryObject.status = status;
    }

    if (company) {
      // Use case-insensitive substring match (more user friendly than exact match)
      queryObject.company = { $regex: company, $options: 'i' };
    }

    // Pagination & sorting
    const pageNumber = Number(page) > 0 ? Number(page) : 1;
    const limitNumber = Number(limit) > 0 ? Number(limit) : 10;
    const skip = (pageNumber - 1) * limitNumber;

    let jobsQuery = Job.find(queryObject);

    if (sort) {
      const sortList = sort.split(',').join(' ');
      jobsQuery = jobsQuery.sort(sortList);
    } else {
      jobsQuery = jobsQuery.sort('-createdAt');
    }

    // Get total matching documents (for pagination)
    const total = await Job.countDocuments(queryObject);

    // Apply skip/limit for page
    const jobs = await jobsQuery.skip(skip).limit(limitNumber);

    res.status(200).json({
      count: total,      // total matching items across all pages
      page: pageNumber,
      limit: limitNumber,
      jobs,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/jobs/:id
const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid jobId', 400);
    }

    const job = await Job.findOne({ _id: id, createdBy: req.user.id });
    if (!job) throw new AppError('Job not found', 404);

    res.status(200).json(job);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/jobs/:id
const updateJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid jobId', 400);
    }
    if (req.body.status && !ALLOWED_STATUS.includes(req.body.status)) {
      throw new AppError('Invalid status', 400);
    }

    const job = await Job.findOneAndUpdate(
      { _id: id, createdBy: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!job) throw new AppError('Job not found or unauthorized', 404);

    res.status(200).json(job);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/jobs/:id
const deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid jobId', 400);
    }

    const job = await Job.findOneAndDelete({ _id: id, createdBy: req.user.id });
    if (!job) throw new AppError('Job not found or unauthorized', 404);

    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const addInterview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, type, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid jobId', 400);
    }

    if (!date) throw new AppError('Interview date is required', 400);

    const job = await Job.findOne({ _id: id, createdBy: req.user.id });
    if (!job) throw new AppError('Job not found', 404);

    const interview = {
      date: new Date(date),
      type: type || 'virtual',
      notes: notes?.trim(),
    };

    job.interviews.push(interview);
    await job.save();

    res.status(201).json({
      message: 'Interview added successfully',
      interviews: job.interviews,
    });
  } catch (err) {
    next(err);
  }
};

const getInterviews = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid jobId', 400);
    }

    const job = await Job.findOne({ _id: id, createdBy: req.user.id });
    if (!job) throw new AppError('Job not found', 404);

    res.status(200).json({ interviews: job.interviews });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  addInterview,
  getInterviews
};
