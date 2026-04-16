// src/models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  headline: String,
  location: String,
  bio: String,
  resumeKey: String,
  avatarKey: String,
  isVerified: { type: Boolean, default: false },
  verifyTokenHash: String,
  verifyTokenExpires: Date,
  resetPasswordTokenHash: String,
  resetPasswordExpires: Date,
  passwordChangedAt: Date,
  emailConfirmed: { type: Boolean, default: false },
  emailConfirmToken: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);