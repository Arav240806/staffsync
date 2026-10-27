const router = require('express').Router();
const Announcement = require('../models/Announcement');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    res.json(await Announcement.find().populate('postedBy', 'name').sort('-createdAt').limit(limit));
  } catch (err) {
    next(err);
  }
});

router.post('/', authorize('hr'), async (req, res, next) => {
  try {
    const { title, body, category } = req.body;
    const item = await Announcement.create({ title, body, category, postedBy: req.user._id });
    res.status(201).json(await item.populate('postedBy', 'name'));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authorize('hr'), async (req, res, next) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
