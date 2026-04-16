// controllers/avatarController.js
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const mongoose = require('mongoose');
const User = require('../models/user');
const s3 = require('../utils/awsS3');
const AppError = require('../utils/AppError');

// ✅ Upload avatar
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400);

    const user = await User.findById(req.user.id);
    if (!user) throw new AppError('User not found', 404);

    const fileKey = `avatars/${req.user.id}-${Date.now()}-${req.file.originalname}`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    user.avatarKey = fileKey;
    await user.save();

    let previewUrl = null;
    try {
      const cmd = new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: fileKey });
      previewUrl = await getSignedUrl(s3, cmd, { expiresIn: 120 });
    } catch (_) {}

    res.status(200).json({ key: fileKey, url: previewUrl });
  } catch (err) {
    next(err);
  }
};

// ✅ Get avatar (presigned URL)
const getAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.avatarKey) throw new AppError('Avatar not found', 404);

    const command = new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: user.avatarKey });
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    res.json({ url: signedUrl });
  } catch (err) {
    next(err);
  }
};

// ✅ Delete avatar
const deleteAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.avatarKey) throw new AppError('No avatar to delete', 404);

    await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: user.avatarKey }));

    user.avatarKey = undefined;
    await user.save();

    res.status(200).json({ message: 'Avatar deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadAvatar, getAvatar, deleteAvatar };
