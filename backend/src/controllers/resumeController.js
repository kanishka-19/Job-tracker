// controllers/resumeController.js
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const mongoose = require('mongoose');
const Job = require('../models/job');
const s3 = require('../utils/awsS3');
const AppError = require('../utils/AppError');

const uploadResume = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(jobId)) throw new AppError('Invalid jobId', 400);

    const job = await Job.findOne({ _id: jobId, createdBy: req.user.id });
    if (!job) throw new AppError('Job not found', 404);
    if (!req.file) throw new AppError('No file uploaded', 400);

    const fileKey = `resumes/${jobId}-${Date.now()}-${req.file.originalname}`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    // ✅ Best practice: store the KEY, not a public URL
    job.resumeKey = fileKey;          // <-- add this field in Job schema (String, optional)
    job.resumeUrl = undefined;        // backward-compat cleanup (optional)
    await job.save();

    // Optional convenience: short-lived preview URL right after upload
    let previewUrl = null;
    try {
      const cmd = new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: fileKey });
      previewUrl = await getSignedUrl(s3, cmd, { expiresIn: 120 }); // 2 minutes
    } catch (_) {}

    res.status(200).json({ key: fileKey, url: previewUrl });
  } catch (err) {
    next(err);
  }
};

const getResume = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(jobId)) throw new AppError('Invalid jobId', 400);

    const job = await Job.findOne({ _id: jobId, createdBy: req.user.id });
    if (!job) throw new AppError('Job not found', 404);

    // Prefer resumeKey; fall back to old resumeUrl if present
    let key = job.resumeKey;
    if (!key && job.resumeUrl) key = job.resumeUrl.split('.amazonaws.com/')[1];
    if (!key) throw new AppError('Resume not found', 404);

    const command = new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key });
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes

    res.json({ url: signedUrl });
  } catch (err) {
    next(err);
  }
};

const deleteResume = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(jobId)) throw new AppError('Invalid jobId', 400);

    const job = await Job.findOne({ _id: jobId, createdBy: req.user.id });
    if (!job) throw new AppError('Job not found', 404);

    // Prefer resumeKey; fall back to key derived from old resumeUrl
    let key = job.resumeKey;
    if (!key && job.resumeUrl) key = job.resumeUrl.split('.amazonaws.com/')[1];
    if (!key) throw new AppError('No resume to delete', 404);

    await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }));

    job.resumeKey = undefined;
    job.resumeUrl = undefined; // cleanup legacy field
    await job.save();

    res.status(200).json({ message: 'Resume deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadResume, getResume, deleteResume };
