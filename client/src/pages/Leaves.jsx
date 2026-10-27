import { useCallback, useEffect, useState } from 'react';
import { api, fmtDate } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { Empty, ErrorText, Field, Modal, PageHead, Pill } from '../components/ui.jsx';

export default function Leaves() {
  const { user, refresh } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ type: 'casual', fromDate: '', toDate: '', reason: '' });

  const load = useCallback(() => api('/leaves/mine').then(setLeaves).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/leaves', { method: 'POST', body: form });
      setOpen(false);
      setForm({ type: 'casual', fromDate: '', toDate: '', reason: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const cancel = async (id) => {
    try {
      await api(`/leaves/${id}`, { method: 'DELETE' });
      load();
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const b = user.leaveBalance;
  return (
    <>
      <PageHead title="My leaves" subtitle="Apply for time off and track your requests."
        action={<button className="btn" onClick={() => { setError(''); setOpen(true); }}>Apply for leave</button>} />
      {!open && <ErrorText>{error}</ErrorText>}

      <div className="panel">
        <h2>Balance</h2>
        <div className="balance">
          <div><strong>{b.casual}</strong><span>Casual</span></div>
          <div><strong>{b.sick}</strong><span>Sick</span></div>
          <div><strong>{b.earned}</strong><span>Earned</span></div>
        </div>
      </div>

      <div className="panel table-wrap">
        {leaves.length === 0 ? <Empty>You have not applied for any leave yet.</Empty> : (
          <table>
            <thead><tr><th>Type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {leaves.map((l) => (
                <tr key={l._id}>
                  <td style={{ textTransform: 'capitalize' }}>{l.type}</td>
                  <td>{fmtDate(l.fromDate)} to {fmtDate(l.toDate)}</td>
                  <td>{l.days}</td>
                  <td>{l.reason}{l.reviewNote && <p className="muted">Note: {l.reviewNote}</p>}</td>
                  <td><Pill value={l.status} />{l.reviewedBy && <p className="muted" style={{ fontSize: '.8rem' }}>by {l.reviewedBy.name}</p>}</td>
                  <td>{l.status === 'pending' && <button className="btn btn-ghost btn-sm" onClick={() => cancel(l._id)}>Cancel</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <Modal title="Apply for leave" onClose={() => setOpen(false)}>
          <form onSubmit={submit}>
            <ErrorText>{error}</ErrorText>
            <Field label="Leave type">
              <select value={form.type} onChange={set('type')}>
                <option value="casual">Casual</option>
                <option value="sick">Sick</option>
                <option value="earned">Earned</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </Field>
            <div className="row">
              <Field label="From"><input type="date" value={form.fromDate} onChange={set('fromDate')} required /></Field>
              <Field label="To"><input type="date" value={form.toDate} min={form.fromDate} onChange={set('toDate')} required /></Field>
            </div>
            <Field label="Reason"><textarea value={form.reason} onChange={set('reason')} required /></Field>
            <button className="btn">Submit request</button>
          </form>
        </Modal>
      )}
    </>
  );
}
