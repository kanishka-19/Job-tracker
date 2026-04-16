// models/job.js
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    body: { type: String, required: [true, 'Note body is required'], trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// ✅ New interview schema
const interviewSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Interview date is required'],
    },
    type: {
      type: String,
      enum: ['phone', 'virtual', 'onsite', 'other'],
      default: 'virtual',
    },
    notes: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const jobSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, 'Company is required'],
      trim: true,
    },
    position: {
      type: String,
      required: [true, 'Position is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['applied', 'pending', 'interview', 'rejected'],
      default: 'pending',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: [noteSchema],
    resumeKey: { type: String },
    // ✅ New field for interviews
    interviews: [interviewSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Job || mongoose.model('Job', jobSchema);
