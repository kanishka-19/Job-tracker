// controllers/statsController.js
const mongoose = require('mongoose');
const Job = require('../models/job');
const AppError = require('../utils/AppError');

const getStats = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError('Unauthorized', 401);
    }

    // ---------- STATUS COUNTS ----------
    const stats = await Job.aggregate([
      { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const defaultStats = { pending: 0, interview: 0, rejected: 0, applied: 0 };
    stats.forEach((s) => {
      defaultStats[s._id] = s.count;
    });

    // ---------- MONTHLY APPLICATIONS ----------
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    let monthlyApplications = await Job.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }, // oldest → newest
    ]);

    monthlyApplications = monthlyApplications.map(({ _id: { year, month }, count }) => {
      const date = new Date(year, month - 1).toLocaleString('default', {
        month: 'short',
        year: 'numeric',
      });
      return { date, count };
    });

    res.status(200).json({ defaultStats, monthlyApplications });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats };
