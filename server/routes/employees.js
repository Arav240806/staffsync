const router = require('express').Router();
const User = require('../models/User');
const { protect, authorize, scopeIds } = require('../middleware/auth');

router.use(protect);

// HR: all employees. Manager: direct reports.
router.get('/', authorize('hr', 'manager'), async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'manager') filter.manager = req.user._id;
    if (req.query.active !== 'all') filter.isActive = true;
    const users = await User.find(filter).populate('manager', 'name').sort('name');
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.post('/', authorize('hr'), async (req, res, next) => {
  try {
    const { password, ...rest } = req.body;
    const user = await User.create({ ...rest, password: password || 'Welcome@123' });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authorize('hr'), async (req, res, next) => {
  try {
    const { password, ...rest } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Employee not found' });
    Object.assign(user, rest);
    if (password) user.password = password;
    await user.save();
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Deactivate instead of deleting so leave and attendance history stays intact
router.delete('/:id', authorize('hr'), async (req, res, next) => {
  try {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ message: 'Employee not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
