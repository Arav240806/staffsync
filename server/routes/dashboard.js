const router = require('express').Router();
const User = require('../models/User');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const { protect, scopeIds } = require('../middleware/auth');

router.get('/stats', protect, async (req, res, next) => {
  try {
    if (req.user.role === 'employee') {
      const pending = await Leave.countDocuments({ employee: req.user._id, status: 'pending' });
      return res.json({ pendingLeaves: pending });
    }
    const ids = await scopeIds(req.user);
    const today = new Date().toLocaleDateString('en-CA');
    const people = ids ? { _id: { $in: ids } } : { isActive: true };
    const scope = ids ? { $in: ids } : { $ne: req.user._id };

    const [headcount, presentToday, pendingLeaves] = await Promise.all([
      User.countDocuments(people),
      Attendance.countDocuments({ date: today, ...(ids ? { employee: { $in: ids } } : {}) }),
      Leave.countDocuments({ employee: scope, status: 'pending' }),
    ]);
    res.json({ headcount, presentToday, pendingLeaves });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
