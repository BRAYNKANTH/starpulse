import { useState } from 'react';
import { BarChart3, MessageSquare, QrCode, Star, UtensilsCrossed } from 'lucide-react';
import { api } from '../data/api';

const FEATURES = [
  { icon: UtensilsCrossed, title: 'Menus customers love', text: '23 designer templates, live on every table in minutes.' },
  { icon: QrCode, title: 'Branded QR & NFC', text: 'Print once, change the destination any time.' },
  { icon: MessageSquare, title: 'Private feedback inbox', text: 'Hear from guests before they post a review.' },
  { icon: BarChart3, title: 'Scan analytics', text: 'See which shops and posters get scanned.' },
];

const Brand = ({ className = '' }) => <div className={`sp-brand ${className}`}><span className="sp-brand-mark"><Star size={16} /></span>StarPulse</div>;

function AuthLayout({ children }) {
  return <div className="auth-layout">
    <section className="auth-pitch" aria-label="About StarPulse">
      <Brand />
      <h2>Your shop’s menu, QR codes and reviews in one studio.</h2>
      <ul>{FEATURES.map(({ icon: Icon, title, text }) => <li key={title}><span className="auth-feature-icon"><Icon size={18} /></span><span><strong>{title}</strong>{text}</span></li>)}</ul>
    </section>
    {children}
  </div>;
}

export default function AuthScreen({ onAuthenticated }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const field = name => ({ value: form[name], onChange: event => setForm(current => ({ ...current, [name]: event.target.value })) });

  const submit = async event => {
    event.preventDefault();
    setBusy(true); setError('');
    try { onAuthenticated(await api('/auth/login', { method: 'POST', body: JSON.stringify(form) })); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return <AuthLayout>
    <form className="auth-card" onSubmit={submit}>
      <Brand className="auth-card-brand" />
      <h1>Welcome back</h1>
      <p>Sign in to manage your shops.</p>
      <label className="form-label" htmlFor="auth-email">Email</label>
      <input id="auth-email" className="form-input" type="email" autoComplete="email" required autoFocus {...field('email')} />
      <label className="form-label" htmlFor="auth-password">Password</label>
      <input id="auth-password" className="form-input" type="password" autoComplete="current-password" maxLength={200} required {...field('password')} />
      {error && <p className="notice error" role="alert">{error}</p>}
      <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      <p className="auth-footnote">Need an account or forgot your password? Contact your StarPulse administrator.</p>
    </form>
  </AuthLayout>;
}

// Shown after signing in with a temporary password from an administrator.
export function ChoosePasswordScreen({ account, onDone, onSignOut }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async event => {
    event.preventDefault();
    if (password !== confirm) { setError('The passwords do not match.'); return; }
    setBusy(true); setError('');
    try { onDone(await api('/auth/me', { method: 'PATCH', body: JSON.stringify({ newPassword: password }) })); }
    catch (e) { setError(e.message); setBusy(false); }
  };

  return <AuthLayout>
    <form className="auth-card" onSubmit={submit}>
      <Brand className="auth-card-brand" />
      <h1>Choose your password</h1>
      <p>Welcome, {account.user.name}. Replace the temporary password you were given with one only you know.</p>
      <input type="email" autoComplete="username" value={account.user.email} readOnly hidden />
      <label className="form-label" htmlFor="choose-password">New password</label>
      <input id="choose-password" className="form-input" type="password" autoComplete="new-password" minLength={8} maxLength={200} required autoFocus value={password} onChange={event => setPassword(event.target.value)} />
      <p className="field-help">At least 8 characters.</p>
      <label className="form-label" htmlFor="confirm-password">Confirm password</label>
      <input id="confirm-password" className="form-input" type="password" autoComplete="new-password" required value={confirm} onChange={event => setConfirm(event.target.value)} />
      {error && <p className="notice error" role="alert">{error}</p>}
      <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Saving…' : 'Save and continue'}</button>
      <button type="button" className="btn btn-ghost btn-block" onClick={onSignOut}>Sign out</button>
    </form>
  </AuthLayout>;
}
