import { useState } from 'react';
import { api, fmtDate } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { ErrorText, Field, PageHead } from '../components/ui.jsx';

export default function Profile() {
  const { user, refresh } = useAuth();
  const [contact, setContact] = useState({ phone: user.phone || '', address: user.address || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const run = async (fn, done) => {
    setMsg(''); setError('');
    try {
      await fn();
      setMsg(done);
    } catch (err) {
      setError(err.message);
    }
  };

  const saveContact = (e) => {
    e.preventDefault();
    run(async () => { await api('/auth/profile', { method: 'PUT', body: contact }); await refresh(); }, 'Contact details saved');
  };
  const changePw = (e) => {
    e.preventDefault();
    run(async () => { await api('/auth/password', { method: 'PUT', body: pw }); setPw({ currentPassword: '', newPassword: '' }); }, 'Password updated');
  };

  const rows = [
    ['Name', user.name], ['Email', user.email], ['Role', user.role], ['Department', user.department || '-'],
    ['Designation', user.designation || '-'], ['Reports to', user.manager?.name || '-'], ['Joined', fmtDate(user.joiningDate)],
  ];

  return (
    <>
      <PageHead title="My profile" subtitle="Your records. Ask HR to change anything you cannot edit here." />
      {msg && <p className="panel" style={{ color: 'var(--green)', background: 'var(--green-bg)' }} role="status">{msg}</p>}
      <ErrorText>{error}</ErrorText>

      <div className="panel">
        <h2>Employment details</h2>
        <div className="grid grid-2">
          {rows.map(([k, v]) => (
            <div key={k}><span className="muted" style={{ fontSize: '.85rem' }}>{k}</span><p style={{ textTransform: k === 'Role' ? 'capitalize' : 'none' }}>{v}</p></div>
          ))}
        </div>
      </div>

      <div className="grid grid-2">
        <form className="panel" onSubmit={saveContact}>
          <h2>Contact details</h2>
          <Field label="Phone"><input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} /></Field>
          <Field label="Address"><textarea value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} /></Field>
          <button className="btn">Save contact details</button>
        </form>
        <form className="panel" onSubmit={changePw}>
          <h2>Change password</h2>
          <Field label="Current password"><input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required /></Field>
          <Field label="New password"><input type="password" minLength={6} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required /></Field>
          <button className="btn">Update password</button>
        </form>
      </div>
    </>
  );
}
