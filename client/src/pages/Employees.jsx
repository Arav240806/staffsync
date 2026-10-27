import { useCallback, useEffect, useState } from 'react';
import { api, fmtDate, toInput } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { Empty, ErrorText, Field, Modal, PageHead } from '../components/ui.jsx';

const blank = { name: '', email: '', password: '', role: 'employee', department: '', designation: '', phone: '', joiningDate: '', manager: '' };

export default function Employees() {
  const { user } = useAuth();
  const isHR = user.role === 'hr';
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | user
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');

  const load = useCallback(() => api('/employees').then(setList).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const openForm = (u) => {
    setError('');
    setEditing(u || 'new');
    setForm(u ? { ...blank, ...u, password: '', joiningDate: toInput(u.joiningDate), manager: u.manager?._id || '' } : blank);
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setError('');
    const body = { ...form, manager: form.manager || null };
    if (!body.password) delete body.password;
    if (!body.joiningDate) delete body.joiningDate;
    try {
      if (editing === 'new') await api('/employees', { method: 'POST', body });
      else await api(`/employees/${editing._id}`, { method: 'PUT', body });
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const deactivate = async (u) => {
    if (!window.confirm(`Deactivate ${u.name}? They will no longer be able to sign in.`)) return;
    try {
      await api(`/employees/${u._id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const shown = list.filter((u) => `${u.name} ${u.email} ${u.department}`.toLowerCase().includes(search.toLowerCase()));
  const managers = list.filter((u) => u.role === 'manager');

  return (
    <>
      <PageHead title={isHR ? 'Employees' : 'My team'} subtitle={isHR ? 'Add people and keep their records up to date.' : 'People who report to you.'}
        action={isHR && <button className="btn" onClick={() => openForm()}>Add employee</button>} />
      {!editing && <ErrorText>{error}</ErrorText>}
      <input placeholder="Search by name, email or department" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 340, marginBottom: '1rem' }} />

      <div className="panel table-wrap">
        {shown.length === 0 ? <Empty>No employees found.</Empty> : (
          <table>
            <thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Manager</th><th>Joined</th>{isHR && <th></th>}</tr></thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u._id} style={u.isActive ? {} : { opacity: 0.5 }}>
                  <td>{u.name}<p className="muted" style={{ fontSize: '.8rem' }}>{u.email}</p></td>
                  <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                  <td>{u.department}<p className="muted" style={{ fontSize: '.8rem' }}>{u.designation}</p></td>
                  <td>{u.manager?.name || '-'}</td>
                  <td>{fmtDate(u.joiningDate)}</td>
                  {isHR && (
                    <td><div className="actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openForm(u)}>Edit</button>
                      {u.isActive && u._id !== user._id && <button className="btn btn-ghost btn-sm" onClick={() => deactivate(u)}>Deactivate</button>}
                    </div></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Add employee' : `Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <form onSubmit={save}>
            <ErrorText>{error}</ErrorText>
            <div className="row">
              <Field label="Full name"><input value={form.name} onChange={set('name')} required /></Field>
              <Field label="Email"><input type="email" value={form.email} onChange={set('email')} required /></Field>
            </div>
            <div className="row">
              <Field label={editing === 'new' ? 'Initial password' : 'New password (leave blank to keep)'}>
                <input type="text" value={form.password} onChange={set('password')} minLength={6} placeholder={editing === 'new' ? 'Defaults to Welcome@123' : ''} />
              </Field>
              <Field label="Role">
                <select value={form.role} onChange={set('role')}>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="hr">HR</option>
                </select>
              </Field>
            </div>
            <div className="row">
              <Field label="Department"><input value={form.department} onChange={set('department')} /></Field>
              <Field label="Designation"><input value={form.designation} onChange={set('designation')} /></Field>
            </div>
            <div className="row">
              <Field label="Phone"><input value={form.phone} onChange={set('phone')} /></Field>
              <Field label="Joining date"><input type="date" value={form.joiningDate} onChange={set('joiningDate')} /></Field>
            </div>
            <Field label="Reports to">
              <select value={form.manager} onChange={set('manager')}>
                <option value="">No manager</option>
                {managers.filter((m) => editing === 'new' || m._id !== editing._id).map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </Field>
            <button className="btn">Save employee</button>
          </form>
        </Modal>
      )}
    </>
  );
}
