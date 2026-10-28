import { useCallback, useEffect, useState } from 'react';
import { Copy, KeyRound, Trash2, UserPlus } from 'lucide-react';
import { api } from '../data/api';
import { PLANS } from '../data/plans';
import Field from './Field';

// Shows a temporary password once, so the administrator can pass it to the client.
function Credentials({ credentials, onClose }) {
  const [copied, setCopied] = useState(false);
  const text = `DQ.lk sign-in\nAddress: ${window.location.origin}\nEmail: ${credentials.email}\nTemporary password: ${credentials.password}\nYou will choose your own password after signing in.`;
  const copy = async () => { try { await navigator.clipboard.writeText(text); setCopied(true); } catch { setCopied(false); } };
  return <section className="card credentials-card" role="status">
    <div className="card-head"><div><h2>{credentials.title}</h2><p>Give these details to {credentials.name}. The password is shown only now.</p></div></div>
    <dl className="credentials-list">
      <dt>Address</dt><dd>{window.location.origin}</dd>
      <dt>Email</dt><dd>{credentials.email}</dd>
      <dt>Temporary password</dt><dd><code>{credentials.password}</code></dd>
    </dl>
    <div className="page-actions"><button type="button" className="btn btn-primary" onClick={copy}><Copy size={16} />{copied ? 'Copied' : 'Copy sign-in details'}</button><button type="button" className="btn btn-secondary" onClick={onClose}>Done</button></div>
  </section>;
}

export default function AdminAccounts({ currentUser, notify, onShopsChanged }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', plan: 'free' });
  const [busy, setBusy] = useState(false);
  const [credentials, setCredentials] = useState(null);

  const load = useCallback(() => api('/accounts').then(setData).catch(e => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const create = async event => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const { account, password } = await api('/accounts', { method: 'POST', body: JSON.stringify(form) });
      setCredentials({ title: 'Account created', name: account.name, email: account.email, password });
      setForm({ name: '', email: '', plan: 'free' });
      load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const update = async (account, changes, message) => {
    setError('');
    try {
      const result = await api(`/accounts/${account.id}`, { method: 'PATCH', body: JSON.stringify(changes) });
      if (result.password) setCredentials({ title: 'Password reset', name: account.name, email: account.email, password: result.password });
      else notify(message);
      load();
    } catch (e) { setError(e.message); }
  };
  const remove = async account => {
    if (!window.confirm(`Delete ${account.name} (${account.email}) with ${account.shops} shop${account.shops === 1 ? '' : 's'}, all feedback and scan history? Their printed QR codes will stop working.`)) return;
    try { await api(`/accounts/${account.id}`, { method: 'DELETE', body: '{}' }); notify(`${account.name}'s account deleted.`); load(); onShopsChanged(); } catch (e) { setError(e.message); }
  };
  const assign = async (shop, ownerId) => {
    try { await api(`/accounts/shops/${shop.id}`, { method: 'PUT', body: JSON.stringify({ ownerId: ownerId || null }) }); notify(`${shop.name} moved.`); load(); onShopsChanged(); } catch (e) { setError(e.message); }
  };

  const accounts = data?.accounts || [];
  return <div className="sp-page">
    <header className="page-header"><div><h1>Clients</h1><p>Create sign-ins for the shop owners you work with, set how many shops they can have, and hand shops over to them.</p></div></header>
    {error && <p className="notice error" role="alert">{error}</p>}
    {credentials && <Credentials credentials={credentials} onClose={() => setCredentials(null)} />}
    <form className="card" onSubmit={create}>
      <div className="card-head"><div><h2>New client account</h2><p>A temporary password is generated. The client replaces it the first time they sign in.</p></div></div>
      <div className="form-grid form-grid-3">
        <Field id="new-account-name" label="Name" required maxLength={100} value={form.name} onChange={name => setForm(f => ({ ...f, name }))} placeholder="e.g. Nimal Perera" />
        <Field id="new-account-email" label="Email" type="email" required value={form.email} onChange={email => setForm(f => ({ ...f, email }))} placeholder="owner@business.lk" />
        <div className="form-group"><label className="form-label" htmlFor="new-account-plan">Plan</label><select id="new-account-plan" className="form-input" value={form.plan} onChange={event => setForm(f => ({ ...f, plan: event.target.value }))}>{Object.values(PLANS).map(p => <option key={p.id} value={p.id}>{p.name} · {p.shops} shop{p.shops === 1 ? '' : 's'}</option>)}</select></div>
      </div>
      <div className="page-actions"><button className="btn btn-primary" disabled={busy}><UserPlus size={16} />{busy ? 'Creating…' : 'Create account'}</button></div>
    </form>
    <section className="card card-flush">
      <div className="card-head"><div><h2>Everyone with a sign-in</h2><p>{accounts.length} {accounts.length === 1 ? 'person' : 'people'}, including you</p></div></div>
      <div className="table-wrap"><table className="data-table">
        <thead><tr><th>Name</th><th>Plan</th><th className="num">Shops</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>{accounts.map(account => <tr key={account.id}>
          <td><span className="sp-shop-cell"><span><strong>{account.name}{account.role === 'admin' && <span className="badge badge-info admin-badge">Admin</span>}</strong><small>{account.email}</small></span></span></td>
          <td><label className="sr-only" htmlFor={`plan-${account.id}`}>Plan for {account.name}</label><select id={`plan-${account.id}`} className="form-input form-input-sm" value={account.plan} onChange={event => update(account, { plan: event.target.value }, `${account.name} is now on the ${PLANS[event.target.value].name} plan.`)}>{Object.values(PLANS).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></td>
          <td className="num">{account.shops} / {PLANS[account.plan]?.shops ?? '—'}</td>
          <td>{account.mustChangePassword ? <span className="badge badge-warning">Awaiting first sign-in</span> : <span className="badge badge-success">Active</span>}</td>
          <td className="num"><span className="sp-row-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { if (window.confirm(`Reset ${account.name}'s password? They will be signed out everywhere.`)) update(account, { resetPassword: true }); }}><KeyRound size={14} />Reset password</button>
            {account.id !== currentUser.id && <button type="button" className="btn btn-ghost btn-icon btn-sm danger" aria-label={`Delete ${account.name}`} title="Delete account" onClick={() => remove(account)}><Trash2 size={15} /></button>}
          </span></td>
        </tr>)}</tbody>
      </table></div>
    </section>
    <section className="card card-flush">
      <div className="card-head"><div><h2>Shop ownership</h2><p>Set up a shop in your own account, then hand it to a client here. Plan limits do not apply to shops you assign.</p></div></div>
      {!data?.shops.length ? <p className="muted empty-inline">No shops yet.</p> : <div className="table-wrap"><table className="data-table">
        <thead><tr><th>Shop</th><th>Status</th><th>Managed by</th></tr></thead>
        <tbody>{data.shops.map(shop => <tr key={shop.id}>
          <td><strong>{shop.name}</strong></td>
          <td><span className={`badge badge-${shop.published ? 'success' : 'neutral'}`}>{shop.published ? 'Live' : 'Draft'}</span></td>
          <td><label className="sr-only" htmlFor={`owner-${shop.id}`}>Account managing {shop.name}</label><select id={`owner-${shop.id}`} className="form-input form-input-sm" value={shop.ownerId || ''} onChange={event => assign(shop, event.target.value)}>
            {!shop.ownerId && <option value="">Unassigned</option>}
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.email})</option>)}
          </select></td>
        </tr>)}</tbody>
      </table></div>}
    </section>
  </div>;
}
