import { useCallback, useEffect, useState } from 'react';
import { api, fmtDate, fmtTime } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { Empty, ErrorText, PageHead, Pill } from '../components/ui.jsx';

const thisMonth = () => new Date().toLocaleDateString('en-CA').slice(0, 7);

export default function Attendance() {
  const { user } = useAuth();
  const canReview = user.role !== 'employee';
  const [view, setView] = useState('mine');
  const [month, setMonth] = useState(thisMonth());
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [today, setToday] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setToday(await api('/attendance/today'));
      setRows(view === 'mine' ? await api(`/attendance/mine?month=${month}`) : await api(`/attendance?date=${date}`));
    } catch (err) {
      setError(err.message);
    }
  }, [view, month, date]);
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

  return (
    <>
      <PageHead title="Attendance" subtitle="Mark your day and review your history." />
      <ErrorText>{error}</ErrorText>

      <div className="panel">
        <div className="actions" style={{ alignItems: 'center' }}>
          {!today && <button className="btn" onClick={() => mark('check-in')}>Check in</button>}
          {today && !today.checkOut && <button className="btn" onClick={() => mark('check-out')}>Check out</button>}
          {today?.checkOut && <span className="muted">You are done for today.</span>}
          {today && <Pill value={today.status} />}
        </div>
      </div>

      {canReview && (
        <div className="actions" style={{ marginBottom: '1rem' }}>
          <button className={`btn btn-sm ${view === 'mine' ? '' : 'btn-ghost'}`} onClick={() => setView('mine')}>My attendance</button>
          <button className={`btn btn-sm ${view === 'team' ? '' : 'btn-ghost'}`} onClick={() => setView('team')}>{user.role === 'hr' ? 'Everyone' : 'My team'}</button>
        </div>
      )}

      <div className="panel table-wrap">
        <div style={{ maxWidth: 220, marginBottom: '1rem' }}>
          {view === 'mine'
            ? <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Month" />
            : <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />}
        </div>
        {rows.length === 0 ? <Empty>No attendance records for this period.</Empty> : (
          <table>
            <thead>
              <tr>{view === 'team' && <th>Employee</th>}<th>Date</th><th>In</th><th>Out</th><th>Status</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id}>
                  {view === 'team' && <td>{r.employee?.name}<p className="muted" style={{ fontSize: '.8rem' }}>{r.employee?.department}</p></td>}
                  <td>{fmtDate(r.date)}</td>
                  <td>{fmtTime(r.checkIn)}</td>
                  <td>{fmtTime(r.checkOut)}</td>
                  <td><Pill value={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
