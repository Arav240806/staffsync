const router = require('express').Router();
const Attendance = require('../models/Attendance');
const { protect, authorize, scopeIds } = require('../middleware/auth');

router.use(protect);

const todayStr = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in server time
const LATE_AFTER_HOUR = 10; // check-ins after 10:00 count as late

router.post('/check-in', async (req, res, next) => {
  try {
    const date = todayStr();
    if (await Attendance.findOne({ employee: req.user._id, date })) {
      return res.status(400).json({ message: 'You already checked in today' });
    }
    const now = new Date();
    const record = await Attendance.create({
      employee: req.user._id,
      date,
      checkIn: now,
      status: now.getHours() >= LATE_AFTER_HOUR ? 'late' : 'present',
    });
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

router.post('/check-out', async (req, res, next) => {
  try {
    const record = await Attendance.findOne({ employee: req.user._id, date: todayStr() });
    if (!record) return res.status(400).json({ message: 'Check in before you check out' });
    if (record.checkOut) return res.status(400).json({ message: 'You already checked out today' });
    record.checkOut = new Date();
    await record.save();
    res.json(record);
  } catch (err) {
    next(err);
  }
});

router.get('/today', async (req, res, next) => {
  try {
    res.json(await Attendance.findOne({ employee: req.user._id, date: todayStr() }));
  } catch (err) {
    next(err);
  }
});

// My history. Optional ?month=YYYY-MM
router.get('/mine', async (req, res, next) => {
  try {
    const filter = { employee: req.user._id };
    if (req.query.month) filter.date = new RegExp(`^${req.query.month}`);
    res.json(await Attendance.find(filter).sort('-date'));
  } catch (err) {
    next(err);
  }
});

// HR: everyone. Manager: team. Filter by ?date=YYYY-MM-DD or ?month=YYYY-MM
router.get('/', authorize('hr', 'manager'), async (req, res, next) => {
  try {
    const ids = await scopeIds(req.user);
    const filter = ids ? { employee: { $in: ids } } : {};
    if (req.query.date) filter.date = req.query.date;
    else if (req.query.month) filter.date = new RegExp(`^${req.query.month}`);
    const records = await Attendance.find(filter)
      .populate('employee', 'name department')
      .sort('-date');
    res.json(records);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
