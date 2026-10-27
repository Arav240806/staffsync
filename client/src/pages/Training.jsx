import { useCallback, useEffect, useState } from 'react';
import { api, fmtDate, toInput } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { Empty, ErrorText, Field, Modal, PageHead, Pill } from '../components/ui.jsx';

const blank = { title: '', description: '', trainer: '', startDate: '', endDate: '', status: 'upcoming', participants: [] };

export default function Training() {
  const { user } = useAuth();
  const canManage = user.role !== 'employee';
  const [items, setItems] = useState([]);
  const [people, setPeople] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');

  const load = useCallback(() => api('/trainings').then(setItems).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (canManage) api('/employees').then(setPeople).catch(() => {}); }, [canManage]);

  const openForm = (t) => {
    setError('');
    setEditing(t || 'new');
    setForm(t ? { ...t, startDate: toInput(t.startDate), endDate: toInput(t.endDate), participants: t.participants.map((p) => p._id) } : blank);
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggle = (id) =>
    setForm({ ...form, participants: form.participants.includes(id) ? form.participants.filter((p) => p !== id) : [...form.participants, id] });

  const save = async (e) => {
    e.preventDefault();
    setError('');
    const { title, description, trainer, startDate, endDate, status, participants } = form;
    const body = { title, description, trainer, startDate, endDate, status, participants };
    try {
      if (editing === 'new') await api('/trainings', { method: 'POST', body });
      else await api(`/trainings/${editing._id}`, { method: 'PUT', body });
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this training program?')) return;
    try {
      await api(`/trainings/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHead title="Training and development" subtitle={canManage ? 'Plan programs and enrol your team.' : 'Programs you are enrolled in.'}
        action={canManage && <button className="btn" onClick={() => openForm()}>Create program</button>} />
      {!editing && <ErrorText>{error}</ErrorText>}
      <div className="panel">
        {items.length === 0 && <Empty>{canManage ? 'No programs yet. Create one to get started.' : 'You are not enrolled in any program.'}</Empty>}
        {items.map((t) => (
          <div className="item" key={t._id}>
            <div className="item-head"><h3>{t.title}</h3><Pill value={t.status} /></div>
            {t.description && <p>{t.description}</p>}
            <p className="muted" style={{ fontSize: '.88rem', marginTop: '.25rem' }}>
              {fmtDate(t.startDate)} to {fmtDate(t.endDate)}{t.trainer && ` · Trainer: ${t.trainer}`}
            </p>
            {canManage && <p className="muted" style={{ fontSize: '.88rem' }}>Participants: {t.participants.map((p) => p.name).join(', ') || 'None yet'}</p>}
            {canManage && (user.role === 'hr' || t.createdBy?._id === user._id) && (
              <div className="actions" style={{ marginTop: '.5rem' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => openForm(t)}>Edit</button>
                <button className="btn btn-ghost btn-sm" onClick={() => remove(t._id)}>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Create program' : 'Edit program'} onClose={() => setEditing(null)}>
          <form onSubmit={save}>
            <ErrorText>{error}</ErrorText>
            <Field label="Title"><input value={form.title} onChange={set('title')} required /></Field>
            <Field label="Description"><textarea value={form.description} onChange={set('description')} /></Field>
            <div className="row">
              <Field label="Trainer"><input value={form.trainer} onChange={set('trainer')} /></Field>
              <Field label="Status">
                <select value={form.status} onChange={set('status')}>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </Field>
            </div>
            <div className="row">
              <Field label="Start date"><input type="date" value={form.startDate} onChange={set('startDate')} required /></Field>
              <Field label="End date"><input type="date" value={form.endDate} min={form.startDate} onChange={set('endDate')} required /></Field>
            </div>
            <Field label="Participants">
              <div className="checks">
                {people.length === 0 && <span className="muted">No people available to enrol.</span>}
                {people.filter((p) => p.role === 'employee').map((p) => (
                  <label key={p._id}>
                    <input type="checkbox" checked={form.participants.includes(p._id)} onChange={() => toggle(p._id)} />
                    {p.name}
                  </label>
                ))}
              </div>
            </Field>
            <button className="btn">Save program</button>
          </form>
        </Modal>
      )}
    </>
  );
}
