const router = require('express').Router();
const Training = require('../models/Training');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// HR: all. Manager: programs they created. Employee: programs they are enrolled in.
router.get('/', async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === 'manager') filter = { createdBy: req.user._id };
    if (req.user.role === 'employee') filter = { participants: req.user._id };
    const items = await Training.find(filter)
      .populate('participants', 'name')
      .populate('createdBy', 'name')
      .sort('startDate');
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// A manager can only enrol their own team
async function validParticipants(user, ids = []) {
  if (user.role === 'hr') return ids;
  const team = await User.find({ manager: user._id }).select('_id');
  const allowed = new Set(team.map((t) => String(t._id)));
  return ids.filter((id) => allowed.has(String(id)));
}

router.post('/', authorize('hr', 'manager'), async (req, res, next) => {
  try {
    const { participants, ...rest } = req.body;
    if (new Date(rest.endDate) < new Date(rest.startDate)) {
      return res.status(400).json({ message: 'End date must be on or after the start date' });
    }
    const item = await Training.create({
      ...rest,
      participants: await validParticipants(req.user, participants),
      createdBy: req.user._id,
    });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authorize('hr', 'manager'), async (req, res, next) => {
  try {
    const item = await Training.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Training not found' });
    if (req.user.role === 'manager' && String(item.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only edit programs you created' });
    }
    const { participants, ...rest } = req.body;
    Object.assign(item, rest);
    if (participants) item.participants = await validParticipants(req.user, participants);
    await item.save();
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authorize('hr', 'manager'), async (req, res, next) => {
  try {
    const item = await Training.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Training not found' });
    if (req.user.role === 'manager' && String(item.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete programs you created' });
    }
    await item.deleteOne();
    res.json({ message: 'Training deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
