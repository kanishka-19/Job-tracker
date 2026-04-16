// src/controllers/userController.js
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const User = require('../models/user');
const s3 = require('../utils/awsS3');
const Job = require('../models/job');

exports.createProfile = async (req, res, next) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });

    const body = req.body || {};
    const files = req.files || {};

    // Only allow these text fields to be set via this endpoint
    const allowed = ['name', 'headline', 'location', 'bio'];
    const updates = {};
    allowed.forEach((f) => {
      if (Object.prototype.hasOwnProperty.call(body, f) && body[f] !== undefined && body[f] !== null) {
        updates[f] = body[f];
      }
    });

    // IMPORTANT: never allow changing role via this endpoint
    if ('role' in body) {
      // ignore silently or optionally warn
      console.warn(`User ${req.user.id} attempted to set role via profile endpoint; ignored.`);
    }

    const previewUrls = {};

    // Handle optional resume upload
    if (files.resume && Array.isArray(files.resume) && files.resume[0]) {
      const file = files.resume[0];
      const resumeKey = `resumes/${req.user.id}-${Date.now()}-${file.originalname}`;
      await s3.send(new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: resumeKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));
      updates.resumeKey = resumeKey;

      try {
        const cmd = new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: resumeKey });
        previewUrls.resumeUrl = await getSignedUrl(s3, cmd, { expiresIn: 120 });
      } catch (_) { /* ignore preview generation errors */ }
    }

    // Handle optional avatar upload
    if (files.avatar && Array.isArray(files.avatar) && files.avatar[0]) {
      const file = files.avatar[0];
      const avatarKey = `avatars/${req.user.id}-${Date.now()}-${file.originalname}`;
      await s3.send(new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: avatarKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));
      updates.avatarKey = avatarKey;

      try {
        const cmd = new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: avatarKey });
        previewUrls.avatarUrl = await getSignedUrl(s3, cmd, { expiresIn: 120 });
      } catch (_) { /* ignore */ }
    }

    // Update user document (upsert-like behavior; user exists)
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json({ message: 'Profile saved', user, previewUrls });
  } catch (err) {
    next(err);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    let avatarUrl = null;
    let resumeUrl = null;

    if (user.avatarKey) {
      try {
        const cmd = new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: user.avatarKey });
        avatarUrl = await getSignedUrl(s3, cmd, { expiresIn: 120 });
      } catch (e) {
        console.error('Failed to generate avatar presigned URL', e);
      }
    }

    if (user.resumeKey) {
      try {
        const cmd = new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: user.resumeKey });
        resumeUrl = await getSignedUrl(s3, cmd, { expiresIn: 120 });
      } catch (e) {
        console.error('Failed to generate resume presigned URL', e);
      }
    }

    res.json({
      ...user.toObject(),
      avatarUrl,
      resumeUrl,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });

    const body = req.body || {};
    const files = req.files || {};
    const allowed = ['name', 'headline', 'location', 'bio'];
    const updates = {};
    const previewUrls = {};

    // 1) Text fields (partial allowed)
    allowed.forEach((f) => {
      if (Object.prototype.hasOwnProperty.call(body, f) && body[f] !== undefined) {
        updates[f] = body[f];
      }
    });

    // 2) Explicit deletion via JSON: resumeKey: null or avatarKey: null
    if (Object.prototype.hasOwnProperty.call(body, 'resumeKey') && body.resumeKey == null) {
      const cur = await User.findById(req.user.id).select('resumeKey');
      if (cur && cur.resumeKey) {
        try {
          await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: cur.resumeKey }));
        } catch (e) {
          console.error('S3 delete (resume) failed', e);
        }
      }
      updates.resumeKey = undefined;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'avatarKey') && body.avatarKey == null) {
      const cur = await User.findById(req.user.id).select('avatarKey');
      if (cur && cur.avatarKey) {
        try {
          await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: cur.avatarKey }));
        } catch (e) {
          console.error('S3 delete (avatar) failed', e);
        }
      }
      updates.avatarKey = undefined;
    }

    // 3) File uploads (multipart) — if present, upload to S3 and set keys
    if (files.resume && Array.isArray(files.resume) && files.resume[0]) {
      const file = files.resume[0];
      const resumeKey = `resumes/${req.user.id}-${Date.now()}-${file.originalname}`;
      await s3.send(new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: resumeKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));
      updates.resumeKey = resumeKey;

      try {
        const cmd = new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: resumeKey });
        previewUrls.resumeUrl = await getSignedUrl(s3, cmd, { expiresIn: 120 });
      } catch (e) { /* ignore preview errors */ }
    }

    if (files.avatar && Array.isArray(files.avatar) && files.avatar[0]) {
      const file = files.avatar[0];
      const avatarKey = `avatars/${req.user.id}-${Date.now()}-${file.originalname}`;
      await s3.send(new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: avatarKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));
      updates.avatarKey = avatarKey;

      try {
        const cmd = new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: avatarKey });
        previewUrls.avatarUrl = await getSignedUrl(s3, cmd, { expiresIn: 120 });
      } catch (e) { /* ignore preview errors */ }
    }

    // 4) If no updates requested (no fields changed and no files), return current user idempotently
    const hasUpdates = Object.keys(updates).length > 0;
    if (!hasUpdates) {
      const user = await User.findById(req.user.id).select('-password');

      // Build preview URLs from existing keys if present
      try {
        if (user?.resumeKey) {
          const rc = new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: user.resumeKey });
          previewUrls.resumeUrl = await getSignedUrl(s3, rc, { expiresIn: 120 });
        }
      } catch (e) {
        console.error('preview resume generation failed', e);
      }

      try {
        if (user?.avatarKey) {
          const ac = new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: user.avatarKey });
          previewUrls.avatarUrl = await getSignedUrl(s3, ac, { expiresIn: 120 });
        }
      } catch (e) {
        console.error('preview avatar generation failed', e);
      }

      return res.json({ message: 'No changes', user, previewUrls });
    }

    // 5) Apply update and return consistent response
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');

    // If keys exist (either existing or newly set), produce previewUrls for them if not already present
    try {
      if (!previewUrls.resumeUrl && user.resumeKey) {
        const cmd = new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: user.resumeKey });
        previewUrls.resumeUrl = await getSignedUrl(s3, cmd, { expiresIn: 120 });
      }
      if (!previewUrls.avatarUrl && user.avatarKey) {
        const cmd = new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: user.avatarKey });
        previewUrls.avatarUrl = await getSignedUrl(s3, cmd, { expiresIn: 120 });
      }
    } catch (e) {
      console.error('previewUrl generation failed', e);
    }

    return res.json({ message: 'Profile updated', user, previewUrls });
  } catch (err) { next(err); }
};

     
exports.deleteResume = async (req, res, next) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const key = user.resumeKey;
    if (!key) return res.status(404).json({ message: 'No resume to delete' });

    try {
      await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }));
    } catch (e) {
      console.error('S3 delete resume failed', e);
      // continue to clear DB key even if S3 delete fails
    }

    user.resumeKey = undefined;
    await user.save();

    res.json({ message: 'Resume deleted' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/user/avatar
exports.deleteAvatar = async (req, res, next) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const key = user.avatarKey;
    if (!key) return res.status(404).json({ message: 'No avatar to delete' });

    try {
      await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }));
    } catch (e) {
      console.error('S3 delete avatar failed', e);
    }

    user.avatarKey = undefined;
    await user.save();

    res.json({ message: 'Avatar deleted' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/user  -> delete user + cascade jobs + S3 cleanup
exports.deleteUser = async (req, res, next) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });

    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // collect user keys to delete
    const userKeys = [];
    if (user.resumeKey) userKeys.push(user.resumeKey);
    if (user.avatarKey) userKeys.push(user.avatarKey);

    // find all jobs owned by this user and collect their resume keys
    const jobs = await Job.find({ createdBy: userId }).select('resumeKey').lean();
    const jobKeys = jobs.map(j => j.resumeKey).filter(Boolean);

    // Delete S3 objects (user keys + job keys) in parallel
    const allKeys = [...userKeys, ...jobKeys];
    await Promise.all(allKeys.map(async (key) => {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }));
      } catch (e) {
        console.error('S3 delete failed for', key, e);
      }
    }));

    // delete jobs
    await Job.deleteMany({ createdBy: userId });

    // finally delete user document
    await User.deleteOne({ _id: userId });

    res.json({ message: 'User and related data deleted' });
  } catch (err) {
    next(err);
  }
};