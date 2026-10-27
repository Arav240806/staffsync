# StaffSync

Human resource management system built with the MERN stack. Three roles: **HR**, **Manager**, **Employee**.

## What each role can do

| Feature | HR | Manager | Employee |
|---|---|---|---|
| Add, edit, deactivate employees | Yes | View own team | - |
| Apply for leave | Yes | Yes | Yes |
| Approve or reject leave | Anyone (not own) | Own team only | - |
| Mark attendance (check in/out) | Yes | Yes | Yes |
| View attendance records | Everyone | Own team | Own |
| Post announcements | Yes | - | View |
| Create training programs | Any | Own team | View enrolled |
| Edit own phone, address, password | Yes | Yes | Yes |

## Project structure

```
staffsync/
  server/   Express API + Mongoose models
  client/   React (Vite) app
```

## Run it locally

You need Node 18+ and MongoDB running locally (or an Atlas connection string).

```bash
# 1. API
cd server
npm install
cp .env.example .env      # then edit MONGO_URI and JWT_SECRET
npm run seed              # loads demo users and data
npm run dev               # http://localhost:5000

# 2. Frontend (new terminal)
cd client
npm install
npm run dev               # http://localhost:5173
```

Demo logins (password `Password@123`):

- HR: `hr@staffsync.com`
- Manager: `manager@staffsync.com`
- Employee: `priya@staffsync.com`

## Database collections

- **users**: name, email, hashed password, role, department, designation, manager (ref), leaveBalance, isActive
- **leaves**: employee (ref), type, fromDate, toDate, days, reason, status, reviewedBy (ref), reviewNote
- **attendances**: employee (ref), date (YYYY-MM-DD), checkIn, checkOut, status. Unique per employee per day.
- **announcements**: title, body, category, postedBy (ref)
- **trainings**: title, description, trainer, dates, status, participants (refs), createdBy (ref)

## API

All routes except `POST /api/auth/login` need `Authorization: Bearer <token>`.

| Method | Route | Access |
|---|---|---|
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Any |
| PUT | `/api/auth/profile`, `/api/auth/password` | Any |
| GET | `/api/employees` | HR, Manager |
| POST, PUT, DELETE | `/api/employees`, `/api/employees/:id` | HR |
| POST | `/api/leaves` | Any |
| GET | `/api/leaves/mine` | Any |
| GET | `/api/leaves/review` | HR, Manager |
| PATCH | `/api/leaves/:id/status` | HR, Manager |
| DELETE | `/api/leaves/:id` (cancel own pending) | Any |
| POST | `/api/attendance/check-in`, `/api/attendance/check-out` | Any |
| GET | `/api/attendance/today`, `/api/attendance/mine` | Any |
| GET | `/api/attendance?date=&month=` | HR, Manager |
| GET | `/api/announcements` | Any |
| POST, DELETE | `/api/announcements` | HR |
| GET | `/api/trainings` | Any (scoped by role) |
| POST, PUT, DELETE | `/api/trainings` | HR, Manager |
| GET | `/api/dashboard/stats` | Any |

## Notes

- Leave is deducted from the employee's balance when it is approved.
- Check-ins after 10:00 server time count as late. Change `LATE_AFTER_HOUR` in `server/routes/attendance.js`.
- Employees are deactivated, not deleted, so leave and attendance history is kept.
- Before deploying, set a long random `JWT_SECRET` and restrict `CLIENT_URL`.
