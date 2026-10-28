import { useState } from 'react';
import { api } from '../data/api';
import { PLANS } from '../data/plans';
import Field from './Field';

export default function AccountSettings({ account, onAccountChange, notify }) {
  const { user, plan, usage } = account;
  const [name, setName] = useState(user.name);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const run = async (key, action) => {
    setBusy(key); setError('');
    try { await action(); } catch (e) { setError(e.message); } finally { setBusy(''); }
  };
  const saveName = event => { event.preventDefault(); run('name', async () => { onAccountChange(await api('/auth/me', { method: 'PATCH', body: JSON.stringify({ name }) })); notify('Name updated.'); }); };
  const savePassword = event => {
    event.preventDefault();
    run('password', async () => {
      onAccountChange(await api('/auth/me', { method: 'PATCH', body: JSON.stringify(passwords) }));
      setPasswords({ currentPassword: '', newPassword: '' });
      notify('Password changed. Other devices have been signed out.');
    });
  };
  const percent = Math.min(100, Math.round((usage.shops / plan.shops) * 100));

  return <div className="sp-page">
    <header className="page-header"><div><h1>Account</h1><p>Your sign-in details, plan and usage.</p></div></header>
    {error && <p className="notice error" role="alert">{error}</p>}
    <div className="sp-stack account-page">
      <section className="card">
        <div className="card-head"><div><h2>Plan</h2><p>You are on the <strong>{plan.name}</strong> plan.</p></div><span className="badge badge-info">{plan.name}</span></div>
        <div className="usage-meter"><div className="usage-meter-label"><span>Shops</span><span>{usage.shops} of {plan.shops}</span></div><div className="usage-meter-track" role="progressbar" aria-valuemin={0} aria-valuemax={plan.shops} aria-valuenow={usage.shops} aria-label="Shops used"><span style={{ width: `${percent}%` }} /></div></div>
        <div className="plan-grid">{Object.values(PLANS).map(p => <div key={p.id} className={`plan-option ${p.id === plan.id ? 'current' : ''}`}><strong>{p.name}</strong><span>{p.shops} shop{p.shops === 1 ? '' : 's'}</span>{p.id === plan.id && <small>Current plan</small>}</div>)}</div>
        <section aria-label="Request a plan change">
          <h3>Request a plan change</h3>
          <p>There is no checkout on this site: plans are set by a DQ.lk administrator after payment is confirmed offline. To request a change, contact your administrator and include:</p>
          <ol>
            <li>Your account email ({user.email}) and your current plan ({plan.name}).</li>
            <li>The plan you want (Free: 1 shop, Pro: 5 shops, Business: 50 shops) and how many shops you need.</li>
            <li>Confirmation that payment has been arranged with the administrator.</li>
          </ol>
          <p className="field-help">How it works: (1) you contact the administrator, (2) the administrator confirms payment offline, (3) the administrator sets your plan on the Accounts page or with the set-plan command, (4) your new shop limit applies immediately — refresh this page to see it. To close your account, contact your DQ.lk administrator.</p>
        </section>
      </section>
      <form className="card" onSubmit={saveName}>
        <div className="card-head"><div><h2>Profile</h2><p>Signed in as {user.email}.</p></div></div>
        <Field id="account-name" label="Your name" value={name} onChange={setName} maxLength={100} required autoComplete="name" />
        <div className="page-actions"><button className="btn btn-primary" disabled={busy === 'name' || !name.trim() || name.trim() === user.name}>{busy === 'name' ? 'Saving…' : 'Save name'}</button></div>
      </form>
      <form className="card" onSubmit={savePassword}>
        <div className="card-head"><div><h2>Password</h2><p>Changing it signs you out on every other device.</p></div></div>
        <input type="email" autoComplete="username" value={user.email} readOnly hidden />
        <div className="form-grid">
          <Field id="current-password" label="Current password" type="password" autoComplete="current-password" required value={passwords.currentPassword} onChange={value => setPasswords(p => ({ ...p, currentPassword: value }))} />
          <Field id="new-password" label="New password" type="password" autoComplete="new-password" minLength={8} maxLength={200} required value={passwords.newPassword} onChange={value => setPasswords(p => ({ ...p, newPassword: value }))} />
        </div>
        <div className="page-actions"><button className="btn btn-primary" disabled={busy === 'password'}>{busy === 'password' ? 'Saving…' : 'Change password'}</button></div>
      </form>
    </div>
  </div>;
}
