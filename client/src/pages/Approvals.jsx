import { useCallback, useEffect, useState } from 'react';
import { api, fmtDate } from '../api.js';
import { Empty, ErrorText, Field, Modal, PageHead, Pill } from '../components/ui.jsx';

export default function Approvals() {
  const [leaves, setLeaves] = useState([]);
  const [tab, setTab] = useState('pending');
  const [error, setError] = useState('');
  const [deciding, setDeciding] = useState(null); // { leave, status }
  const [note, setNote] = useState('');

  const load = useCallback(() => {
    const q = tab === 'pending' ? '?status=pending' : '';
    api(`/leaves/review${q}`).then(setLeaves).catch((e) => setError(e.message));
  }, [tab]);
  useEffect(() => { load(); }, [load]);

  const decide = async () => {
    try {
      await api(`/leaves/${deciding.leave._id}/status`, { method: 'PATCH', body: { status: deciding.status, reviewNote: note } });
      setDeciding(null);
      setNote('');
      setError('');
      load();
    } catch (err) {
      setError(err.message);
      setDeciding(null);
    }
  };

  return (
    <>
      <PageHead title="Leave approvals" subtitle="Review leave requests from the people you manage." />
      <div className="actions" style={{ marginBottom: '1rem' }}>
        <button className={`btn btn-sm ${tab === 'pending' ? '' : 'btn-ghost'}`} onClick={() => setTab('pending')}>Pending</button>
        <button className={`btn btn-sm ${tab === 'all' ? '' : 'btn-ghost'}`} onClick={() => setTab('all')}>All requests</button>
      </div>
      <ErrorText>{error}</ErrorText>
      <div className="panel table-wrap">
        {leaves.length === 0 ? <Empty>{tab === 'pending' ? 'No requests are waiting for review.' : 'No leave requests yet.'}</Empty> : (
          <table>
            <thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {leaves.map((l) => (
                <tr key={l._id}>
                  <td>{l.employee?.name}<p className="muted" style={{ fontSize: '.8rem' }}>{l.employee?.department}</p></td>
                  <td style={{ textTransform: 'capitalize' }}>{l.type}</td>
                  <td>{fmtDate(l.fromDate)} to {fmtDate(l.toDate)}</td>
                  <td>{l.days}</td>
                  <td>{l.reason}</td>
                  <td><Pill value={l.status} /></td>
                  <td>
                    {l.status === 'pending' && (
                      <div className="actions">
                        <button className="btn btn-sm" onClick={() => setDeciding({ leave: l, status: 'approved' })}>Approve</button>
                        <button className="btn btn-sm btn-danger" onClick={() => setDeciding({ leave: l, status: 'rejected' })}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deciding && (
        <Modal title={`${deciding.status === 'approved' ? 'Approve' : 'Reject'} leave for ${deciding.leave.employee?.name}`} onClose={() => setDeciding(null)}>
          <Field label="Note to employee (optional)"><textarea value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <button className={`btn ${deciding.status === 'rejected' ? 'btn-danger' : ''}`} onClick={decide}>
            {deciding.status === 'approved' ? 'Approve leave' : 'Reject leave'}
          </button>
        </Modal>
      )}
    </>
  );
}
