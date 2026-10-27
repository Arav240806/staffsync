import { useCallback, useEffect, useState } from 'react';
import { api, fmtDate } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { Empty, ErrorText, Field, Modal, PageHead, Pill } from '../components/ui.jsx';

export default function Announcements() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', category: 'news' });
  const [error, setError] = useState('');

  const load = useCallback(() => api('/announcements').then(setItems).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const post = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/announcements', { method: 'POST', body: form });
      setOpen(false);
      setForm({ title: '', body: '', category: 'news' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    await api(`/announcements/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <>
      <PageHead title="Announcements" subtitle="News and updates from HR."
        action={user.role === 'hr' && <button className="btn" onClick={() => { setError(''); setOpen(true); }}>Post announcement</button>} />
      {!open && <ErrorText>{error}</ErrorText>}
      <div className="panel">
        {items.length === 0 && <Empty>No announcements yet.</Empty>}
        {items.map((a) => (
          <div className="item" key={a._id}>
            <div className="item-head">
              <h3>{a.title}</h3>
              <Pill value={a.category} />
            </div>
            <p>{a.body}</p>
            <div className="item-head" style={{ marginTop: '.4rem' }}>
              <span className="muted" style={{ fontSize: '.85rem' }}>{a.postedBy?.name}, {fmtDate(a.createdAt)}</span>
              {user.role === 'hr' && <button className="btn btn-ghost btn-sm" onClick={() => remove(a._id)}>Delete</button>}
            </div>
          </div>
        ))}
      </div>

      {open && (
        <Modal title="Post announcement" onClose={() => setOpen(false)}>
          <form onSubmit={post}>
            <ErrorText>{error}</ErrorText>
            <Field label="Title"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
            <Field label="Category">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="news">News</option>
                <option value="policy">Policy</option>
                <option value="event">Event</option>
                <option value="holiday">Holiday</option>
              </select>
            </Field>
            <Field label="Message"><textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></Field>
            <button className="btn">Post announcement</button>
          </form>
        </Modal>
      )}
    </>
  );
}
