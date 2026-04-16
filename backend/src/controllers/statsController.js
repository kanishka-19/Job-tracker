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

    // ---------- MONTHLY APPLICATIONS (past ~6 months) ----------
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

    // Map to friendly shape: { date: 'Aug 2025', count: 9 }
    monthlyApplications = monthlyApplications.map(({ _id: { year, month }, count }) => {
      const date = new Date(year, month - 1).toLocaleString('default', {
        month: 'short',
        year: 'numeric',
      });
      return { date, count };
    });

    // Derived trend stats
    const totalApps = monthlyApplications.reduce((sum, m) => sum + m.count, 0);
    const avgPerMonth = monthlyApplications.length > 0 ? totalApps / monthlyApplications.length : 0;

    // applications this month (last item if any)
    const last = monthlyApplications[monthlyApplications.length - 1] || { count: 0, date: null };
    const prev = monthlyApplications[monthlyApplications.length - 2] || { count: 0, date: null };
    const applicationsThisMonth = last.count || 0;

    // growth vs previous month: safe handling when prev.count === 0
    let growthVsLastMonth = 0;
    if (prev.count === 0) {
      growthVsLastMonth = last.count === 0 ? 0 : 100; // if previous 0 and current >0 -> show 100% growth
    } else {
      growthVsLastMonth = ((last.count - prev.count) / Math.abs(prev.count)) * 100;
    }

    // active months: months with >0 applications in the returned window
    const activeMonths = monthlyApplications.filter((m) => m.count > 0).length;

    const peakMonthObj = monthlyApplications.reduce(
      (max, m) => (m.count > max.count ? m : max),
      { count: 0, date: null }
    );

    const trendStats = {
      totalApps,
      avgPerMonth: Math.round(avgPerMonth),
      applicationsThisMonth,
      growthVsLastMonth: Math.round(growthVsLastMonth), // integer percent
      activeMonths,
      peakMonth: peakMonthObj.date || null,
    };

    res.status(200).json({ defaultStats, monthlyApplications, trendStats });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats };
