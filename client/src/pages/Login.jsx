import { useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import { ErrorText, Field } from '../components/ui.jsx';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <div className="login-side">
        <h1>StaffSync</h1>
        <p>Leave, attendance, training and company news in one place.</p>
      </div>
      <div className="login-form">
        <form onSubmit={submit}>
          <h2>Sign in</h2>
          <ErrorText>{error}</ErrorText>
          <Field label="Work email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </Field>
          <Field label="Password">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          <button className="btn" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
          <p className="hint">Demo: hr@staffsync.com, manager@staffsync.com or priya@staffsync.com. Password: Password@123</p>
        </form>
      </div>
    </div>
  );
}
