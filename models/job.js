const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    body: {
      type: String,
      required: [true, 'Note body is required'],
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
    resumeUrl: { type: String }, // Optional field for resume URL
  },
  { timestamps: true }
);

module.exports = mongoose.models.Job || mongoose.model('Job', jobSchema);

