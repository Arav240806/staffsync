import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', roles: ['hr', 'manager', 'employee'], end: true },
  { to: '/employees', label: 'Employees', roles: ['hr'] },
  { to: '/team', label: 'My team', roles: ['manager'] },
  { to: '/approvals', label: 'Leave approvals', roles: ['hr', 'manager'] },
  { to: '/leaves', label: 'My leaves', roles: ['hr', 'manager', 'employee'] },
  { to: '/attendance', label: 'Attendance', roles: ['hr', 'manager', 'employee'] },
  { to: '/training', label: 'Training', roles: ['hr', 'manager', 'employee'] },
  { to: '/announcements', label: 'Announcements', roles: ['hr', 'manager', 'employee'] },
  { to: '/profile', label: 'Profile', roles: ['hr', 'manager', 'employee'] },
];

const ROLE_LABEL = { hr: 'HR', manager: 'Manager', employee: 'Employee' };

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">StaffSync</div>
        <nav>
          {NAV.filter((n) => n.roles.includes(user.role)).map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="me">
          <strong>{user.name}</strong>
          <span>{ROLE_LABEL[user.role]}</span>
          <button className="btn btn-ghost-light" onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
