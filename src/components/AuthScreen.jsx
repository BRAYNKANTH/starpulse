import { useState } from 'react';
import { BarChart3, MessageSquare, QrCode, UtensilsCrossed } from 'lucide-react';
import { api } from '../data/api';

const FEATURES = [
  { icon: UtensilsCrossed, title: 'Menus customers love', text: '23 designer templates, live on every table in minutes.' },
  { icon: QrCode, title: 'Branded QR & NFC', text: 'Print once, change the destination any time.' },
  { icon: MessageSquare, title: 'Private feedback inbox', text: 'Hear from guests before they post a review.' },
  { icon: BarChart3, title: 'Scan analytics', text: 'See which shops and posters get scanned.' },
];

const Brand = ({ className = '' }) => <div className={`sp-brand ${className}`}><span className="sp-brand-mark"><QrCode size={16} /></span>DQ.lk</div>;

function AuthLayout({ children }) {
  return <main className="auth-layout">
    <section className="auth-pitch" aria-label="About DQ.lk">
      <Brand />
      <p className="auth-pitch-title">Your shop’s menu, QR codes and reviews in one studio.</p>
      <ul>{FEATURES.map(({ icon: Icon, title, text }) => <li key={title}><span className="auth-feature-icon"><Icon size={18} /></span><span><strong>{title}</strong>{text}</span></li>)}</ul>
    </section>
    {children}
  </main>;
}

export default function AuthScreen({ onAuthenticated }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotBusy, setForgotBusy] = useState(false);
  const field = name => ({ value: form[name], onChange: event => setForm(current => ({ ...current, [name]: event.target.value })) });

  const submit = async event => {
    event.preventDefault();
    setBusy(true); setError('');
    try { onAuthenticated(await api('/auth/login', { method: 'POST', body: JSON.stringify(form) })); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const submitForgot = async event => {
    event.preventDefault();
    setForgotBusy(true); setForgotError('');
    try {
      // The server always answers the same way, whether or not the email
      // belongs to an account, so this message is shown unconditionally.
      await api('/auth/forgot', { method: 'POST', body: JSON.stringify({ email: forgotEmail }) });
      setForgotSent(true);
    } catch (e) { setForgotError(e.message); } finally { setForgotBusy(false); }
  };

  if (view === 'forgot') return <AuthLayout>
    <form className="auth-card" onSubmit={submitForgot}>
      <Brand className="auth-card-brand" />
      <h1>Forgot your password?</h1>
      {forgotSent
        ? <><p>If an account exists for that email, a reset link has been sent to it. The link works once only and expires in 1 hour.</p>
          <p>If you do not receive it, check your spam folder, or contact your DQ.lk administrator — they can also reset your password directly.</p></>
        : <><p>Enter the email you sign in with. We will send you a reset link.</p>
          <label className="form-label" htmlFor="forgot-email">Email</label>
          <input id="forgot-email" className="form-input" type="email" autoComplete="email" required autoFocus value={forgotEmail} onChange={event => setForgotEmail(event.target.value)} />
          {forgotError && <p className="notice error" role="alert">{forgotError}</p>}
          <button className="btn btn-primary btn-block" disabled={forgotBusy}>{forgotBusy ? 'Sending…' : 'Send reset link'}</button></>}
      <button type="button" className="btn btn-ghost btn-block" onClick={() => { setView('login'); setForgotSent(false); setForgotError(''); }}>Back to sign in</button>
    </form>
  </AuthLayout>;

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
      <button type="button" className="btn btn-ghost btn-block" onClick={() => setView('forgot')}>Forgot password?</button>
      <p className="auth-footnote">Need an account? Contact your DQ.lk administrator.</p>
    </form>
  </AuthLayout>;
}

// Opened from a reset link (/signin?reset=<token>). Rendered by App before
// the studio branch, so it works whether or not the visitor is signed in.
export function ResetPasswordScreen({ token }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const backToSignIn = () => { window.location.assign('/signin'); };

  const submit = async event => {
    event.preventDefault();
    if (password !== confirm) { setError('The passwords do not match.'); return; }
    setBusy(true); setError('');
    try { await api('/auth/reset', { method: 'POST', body: JSON.stringify({ token, newPassword: password }) }); setDone(true); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return <AuthLayout>
    <form className="auth-card" onSubmit={submit}>
      <Brand className="auth-card-brand" />
      <h1>Reset your password</h1>
      {done
        ? <><p>Your password has been changed, and you have been signed out on every other device.</p>
          <button type="button" className="btn btn-primary btn-block" onClick={backToSignIn}>Back to sign in</button></>
        : token
          ? <><p>Choose a new password. This link works once only and expires 1 hour after it was requested.</p>
            <label className="form-label" htmlFor="reset-password">New password</label>
            <input id="reset-password" className="form-input" type="password" autoComplete="new-password" minLength={8} maxLength={200} required autoFocus value={password} onChange={event => setPassword(event.target.value)} />
            <p className="field-help">At least 8 characters.</p>
            <label className="form-label" htmlFor="reset-confirm">Confirm password</label>
            <input id="reset-confirm" className="form-input" type="password" autoComplete="new-password" required value={confirm} onChange={event => setConfirm(event.target.value)} />
            {error && <p className="notice error" role="alert">{error}</p>}
            <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Saving…' : 'Reset password'}</button>
            <button type="button" className="btn btn-ghost btn-block" onClick={backToSignIn}>Back to sign in</button></>
          : <><p>This reset link is missing its token. Ask for a new one from the sign-in page.</p>
            <button type="button" className="btn btn-primary btn-block" onClick={backToSignIn}>Back to sign in</button></>}
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
