const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Sign in to continue' });
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'This account is not active' });
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Your session expired. Sign in again.' });
  }
};

exports.authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ message: 'You do not have access to this action' });

// Employee ids the current user can see: HR -> null (everyone), manager -> direct reports
exports.scopeIds = async (user) => {
  if (user.role === 'hr') return null;
  const team = await User.find({ manager: user._id }).select('_id');
  return team.map((u) => u._id);
};
