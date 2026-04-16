// scripts/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Job = require('../models/job');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    await User.deleteMany({});
    await Job.deleteMany({});

    const user = await User.create({
      name: 'Demo',
      email: 'demo@example.com',
      password: await bcrypt.hash('password', 10),
    });

    const now = new Date();
    await Job.create([
      { company: 'Google',  position: 'SWE',       status: 'applied',   createdBy: user._id, createdAt: now },
      { company: 'Meta',    position: 'FE Eng',    status: 'interview', createdBy: user._id, createdAt: now },
      { company: 'Netflix', position: 'BE Eng',    status: 'pending',   createdBy: user._id, createdAt: now },
      { company: 'Amazon',  position: 'SDE 1',     status: 'rejected',  createdBy: user._id, createdAt: now },
    ]);

    console.log('Seeded: user demo@example.com / password');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
