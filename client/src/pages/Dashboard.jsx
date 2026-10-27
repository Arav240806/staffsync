import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtDate, fmtTime } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { Empty, ErrorText, PageHead, Pill } from '../components/ui.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [today, setToday] = useState(null);
  const [news, setNews] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [s, t, n] = await Promise.all([
        api('/dashboard/stats'),
        api('/attendance/today'),
        api('/announcements?limit=3'),
      ]);
      setStats(s); setToday(t); setNews(n);
    } catch (err) {
      setError(err.message);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const mark = async (kind) => {
    setError('');
    try {
      await api(`/attendance/${kind}`, { method: 'POST' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const isReviewer = user.role !== 'employee';

  return (
    <>
      <PageHead title={`${greet}, ${user.name.split(' ')[0]}`} subtitle={user.designation || user.department} />
      <ErrorText>{error}</ErrorText>

      <div className="panel">
        <h2>Today's attendance</h2>
        <div className="actions" style={{ alignItems: 'center' }}>
          {!today && <button className="btn" onClick={() => mark('check-in')}>Check in</button>}
          {today && !today.checkOut && <button className="btn" onClick={() => mark('check-out')}>Check out</button>}
          {today && <Pill value={today.status} />}
          <span className="muted">
            {today ? `In ${fmtTime(today.checkIn)}${today.checkOut ? `, out ${fmtTime(today.checkOut)}` : ''}` : 'You have not checked in yet.'}
          </span>
        </div>
      </div>

      {isReviewer && stats && (
        <div className="grid grid-3" style={{ marginBottom: '1.25rem' }}>
          <div className="panel stat" style={{ margin: 0 }}><strong>{stats.headcount}</strong><span>{user.role === 'hr' ? 'Active employees' : 'People in your team'}</span></div>
          <div className="panel stat" style={{ margin: 0 }}><strong>{stats.presentToday}</strong><span>Checked in today</span></div>
          <Link to="/approvals" style={{ color: 'inherit', textDecoration: 'none' }}>
            <div className="panel stat" style={{ margin: 0 }}><strong>{stats.pendingLeaves}</strong><span>Leave requests waiting</span></div>
          </Link>
        </div>
      )}

      <div className="panel">
          <h2>Your leave balance</h2>
          <div className="balance">
            <div><strong>{user.leaveBalance.casual}</strong><span>Casual</span></div>
            <div><strong>{user.leaveBalance.sick}</strong><span>Sick</span></div>
            <div><strong>{user.leaveBalance.earned}</strong><span>Earned</span></div>
          </div>
          {!isReviewer && stats?.pendingLeaves > 0 && <p className="muted" style={{ marginTop: '.75rem' }}>{stats.pendingLeaves} request(s) pending approval.</p>}
      </div>

      <div className="panel">
        <h2>Latest announcements</h2>
        {news.length === 0 && <Empty>No announcements yet.</Empty>}
        {news.map((a) => (
          <div className="item" key={a._id}>
            <div className="item-head"><h3>{a.title}</h3><Pill value={a.category} /></div>
            <p>{a.body}</p>
            <p className="muted" style={{ fontSize: '.85rem' }}>{fmtDate(a.createdAt)}</p>
          </div>
        ))}
      </div>
    </>
  );
}
