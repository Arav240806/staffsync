   const BASE = import.meta.env.VITE_API_URL || 'https://staffsync-api.onrender.com/api';

export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth-expired'));
    }
    throw new Error(data.message || 'Something went wrong. Try again.');
  }
  return data;
}

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
export const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-';
export const toInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
