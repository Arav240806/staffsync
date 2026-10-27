require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Leave = require('./models/Leave');
const Attendance = require('./models/Attendance');
const Announcement = require('./models/Announcement');
const Training = require('./models/Training');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User, Leave, Attendance, Announcement, Training].map((m) => m.deleteMany({})));

  const pw = 'Password@123';
  const hr = await User.create({ name: 'Anita Sharma', email: 'hr@staffsync.com', password: pw, role: 'hr', department: 'Human Resources', designation: 'HR Lead' });
  const mgr = await User.create({ name: 'Rahul Verma', email: 'manager@staffsync.com', password: pw, role: 'manager', department: 'Engineering', designation: 'Engineering Manager' });
  const e1 = await User.create({ name: 'Priya Singh', email: 'priya@staffsync.com', password: pw, role: 'employee', department: 'Engineering', designation: 'Frontend Developer', manager: mgr._id });
  const e2 = await User.create({ name: 'Karan Mehta', email: 'karan@staffsync.com', password: pw, role: 'employee', department: 'Engineering', designation: 'Backend Developer', manager: mgr._id });
  await User.create({ name: 'Neha Joshi', email: 'neha@staffsync.com', password: pw, role: 'employee', department: 'Design', designation: 'UI Designer', manager: mgr._id });

  const d = (offset) => { const x = new Date(); x.setDate(x.getDate() + offset); x.setHours(0, 0, 0, 0); return x; };
  await Leave.create({ employee: e1._id, type: 'casual', fromDate: d(3), toDate: d(4), days: 2, reason: 'Family function' });
  await Leave.create({ employee: e2._id, type: 'sick', fromDate: d(1), toDate: d(1), days: 1, reason: 'Fever' });

  await Announcement.create([
    { title: 'Welcome to StaffSync', body: 'Mark your attendance daily and apply for leave from the Leaves page.', category: 'news', postedBy: hr._id },
    { title: 'Diwali holiday', body: 'The office will be closed for Diwali. Plan your work accordingly.', category: 'holiday', postedBy: hr._id },
  ]);

  await Training.create({ title: 'Secure coding basics', description: 'OWASP top 10 and safe API design.', trainer: 'External consultant', startDate: d(7), endDate: d(8), participants: [e1._id, e2._id], createdBy: mgr._id });

  console.log('Seeded. Sign in with any of these (password: ' + pw + '):');
  console.log('  HR:       hr@staffsync.com');
  console.log('  Manager:  manager@staffsync.com');
  console.log('  Employee: priya@staffsync.com');
  await mongoose.disconnect();
})();
