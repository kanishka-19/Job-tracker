// controllers/notesController.js
const mongoose = require('mongoose');
const Job = require('../models/job');
const AppError = require('../utils/AppError');

// latest note first
const getNotes = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw new AppError('Invalid jobId', 400);
    }

    const job = await Job.findOne({ _id: jobId, createdBy: req.user.id });
    if (!job) {
      throw new AppError('Job not found', 404);
    }

    const notes = [...(job.notes || [])].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({ notes });
  } catch (error) {
    next(error);
  }
};

const addNote = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { body } = req.body;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw new AppError('Invalid jobId', 400);
    }

    if (!body || body.trim() === '') {
      throw new AppError('Note body is required', 400);
    }

    const job = await Job.findOne({ _id: jobId, createdBy: req.user.id });
    if (!job) {
      throw new AppError('Job not found', 404);
    }

    job.notes.push({ body });
    await job.save();

    const notes = [...(job.notes || [])].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(201).json({ notes });
  } catch (error) {
    next(error);
  }
};

const deleteNote = async (req, res, next) => {
  try {
    const { jobId, noteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw new AppError('Invalid jobId', 400);
    }
    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      throw new AppError('Invalid noteId', 400);
    }

    const job = await Job.findOne({ _id: jobId, createdBy: req.user.id });
    if (!job) {
      throw new AppError('Job not found', 404);
    }

    job.notes = job.notes.filter(n => String(n._id) !== String(noteId));
    await job.save();

    const notes = [...(job.notes || [])].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({ notes });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotes,
  addNote,
  deleteNote,
};
