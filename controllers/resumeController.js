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

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw new AppError('Invalid jobId', 400);
    }

    const job = await Job.findOne({ _id: jobId, createdBy: req.user.id });
    if (!job) {
      throw new AppError('Job not found', 404);
    }

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const fileKey = `resumes/${jobId}-${Date.now()}-${req.file.originalname}`;
    console.log('Uploading with creds:', process.env.AWS_ACCESS_KEY_ID ? 'OK' : 'MISSING');

    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    job.resumeUrl = fileUrl;
    await job.save();
    console.log('Saved job in Mongo:', job.toObject());
    console.log('Job schema fields:', Object.keys(Job.schema.paths));

    res.status(200).json({ resumeUrl: fileUrl });
  } catch (err) {
    next(err);
  }
};

// ✅ new controller to generate signed URL for viewing resume
const getResume = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw new AppError('Invalid jobId', 400);
    }

    const job = await Job.findOne({ _id: jobId, createdBy: req.user.id });
    if (!job || !job.resumeUrl) {
      throw new AppError('Resume not found', 404);
    }

    // extract just the key from stored URL
    const key = job.resumeUrl.split('.amazonaws.com/')[1];

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    res.json({ url: signedUrl });
    // or: res.redirect(signedUrl);
  } catch (err) {
    next(err);
  }
};
const deleteResume = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw new AppError('Invalid jobId', 400);
    }

    const job = await Job.findOne({ _id: jobId, createdBy: req.user.id });
    if (!job) {
      throw new AppError('Job not found', 404);
    }
    if (!job.resumeUrl) {
      throw new AppError('No resume to delete', 404);
    }

    // extract S3 key from URL
    const key = job.resumeUrl.split('.amazonaws.com/')[1];

    // delete from S3
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    }));

    // remove from DB
    job.resumeUrl = undefined;
    await job.save();

    res.status(200).json({ message: 'Resume deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadResume, getResume, deleteResume };
