const router = require('express').Router();
const Leave = require('../models/Leave');
const User = require('../models/User');
const { protect, authorize, scopeIds } = require('../middleware/auth');

router.use(protect);

const dayCount = (from, to) => Math.round((to - from) / 86400000) + 1;

// Apply for leave
router.post('/', async (req, res, next) => {
  try {
    const { type, fromDate, toDate, reason } = req.body;
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (isNaN(from) || isNaN(to)) return res.status(400).json({ message: 'Choose valid dates' });
    if (to < from) return res.status(400).json({ message: 'End date must be on or after the start date' });

    const days = dayCount(from, to);
    if (type !== 'unpaid' && (req.user.leaveBalance[type] ?? 0) < days) {
      return res.status(400).json({ message: `Not enough ${type} leave. You have ${req.user.leaveBalance[type] ?? 0} day(s) left.` });
    }

    const overlap = await Leave.findOne({
      employee: req.user._id,
      status: { $in: ['pending', 'approved'] },
      fromDate: { $lte: to },
      toDate: { $gte: from },
    });
    if (overlap) return res.status(400).json({ message: 'You already have a leave request for these dates' });

    const leave = await Leave.create({ employee: req.user._id, type, fromDate: from, toDate: to, days, reason });
    res.status(201).json(leave);
  } catch (err) {
    next(err);
  }
});

// My leaves
router.get('/mine', async (req, res, next) => {
  try {
    const leaves = await Leave.find({ employee: req.user._id })
      .populate('reviewedBy', 'name')
      .sort('-createdAt');
    res.json(leaves);
  } catch (err) {
    next(err);
  }
});

// Requests to review. HR: everyone else. Manager: direct reports.
router.get('/review', authorize('hr', 'manager'), async (req, res, next) => {
  try {
    const ids = await scopeIds(req.user);
    const filter = ids ? { employee: { $in: ids } } : { employee: { $ne: req.user._id } };
    if (req.query.status) filter.status = req.query.status;
    const leaves = await Leave.find(filter)
      .populate('employee', 'name department designation')
      .populate('reviewedBy', 'name')
      .sort('-createdAt');
    res.json(leaves);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', authorize('hr', 'manager'), async (req, res, next) => {
  try {
    const { status, reviewNote } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });
    if (leave.status !== 'pending') return res.status(400).json({ message: 'This request was already reviewed' });
    if (String(leave.employee) === String(req.user._id)) {
      return res.status(403).json({ message: 'You cannot review your own leave' });
    }

    const employee = await User.findById(leave.employee);
    if (req.user.role === 'manager' && String(employee.manager) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only review leave for your own team' });
    }

    if (status === 'approved' && leave.type !== 'unpaid') {
      if (employee.leaveBalance[leave.type] < leave.days) {
        return res.status(400).json({ message: 'Employee does not have enough leave balance' });
      }
      employee.leaveBalance[leave.type] -= leave.days;
      await employee.save();
    }

    leave.status = status;
    leave.reviewNote = reviewNote || '';
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    await leave.save();
    res.json(leave);
  } catch (err) {
    next(err);
  }
});

// Cancel my own pending request
router.delete('/:id', async (req, res, next) => {
  try {
    const leave = await Leave.findOne({ _id: req.params.id, employee: req.user._id });
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });
    if (leave.status !== 'pending') return res.status(400).json({ message: 'Only pending requests can be cancelled' });
    leave.status = 'cancelled';
    await leave.save();
    res.json(leave);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
