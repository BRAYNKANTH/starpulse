import { ExternalLink, Plus, Store, Trash2 } from 'lucide-react';
import { shopUrl } from '../data/api';
import { lastDays, sumDays } from '../utils/format';
import ShopAvatar from './ShopAvatar';

export default function SavedProfiles({ profiles, overview, activeProfile, onSelect, onNew, onDelete, plan }) {
  const days = lastDays(30);
  return <div className="sp-page">
    <header className="page-header">
      <div><h1>All shops</h1><p>Every business in your account · {profiles.length} of {plan.shops} on the {plan.name} plan.</p></div>
      <div className="page-actions"><button type="button" className="btn btn-primary" onClick={onNew}><Plus size={16} />New shop</button></div>
    </header>
    {!profiles.length ? <section className="card empty-state"><Store size={30} /><h2>Create your first shop</h2><p>Add its details, build a menu and publish a customer page.</p><button type="button" className="btn btn-primary" onClick={onNew}><Plus size={16} />New shop</button></section>
      : <section className="card card-flush"><div className="table-wrap"><table className="data-table">
        <thead><tr><th>Shop</th><th>Status</th><th className="num">Menu items</th><th className="num">Scans (30 days)</th><th className="num">Rating</th><th className="num">Unread</th><th><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>{profiles.map(profile => { const stats = overview.find(s => s.id === profile.id); return <tr key={profile.id} className={activeProfile.id === profile.id ? 'selected' : ''}>
          <td><span className="sp-shop-cell"><ShopAvatar profile={profile} /><span><strong>{profile.name}</strong><small>{profile.category || profile.tagline}</small></span></span></td>
          <td><span className={`badge badge-${profile.published ? 'success' : 'neutral'}`}>{profile.published ? 'Live' : 'Draft'}</span></td>
          <td className="num">{(profile.menu || []).length}</td>
          <td className="num">{sumDays(stats?.visits.daily, days).toLocaleString()}</td>
          <td className="num">{stats?.feedback.average ? stats.feedback.average.toFixed(1) : '—'}</td>
          <td className="num">{stats?.feedback.unread || 0}</td>
          <td className="num"><span className="sp-row-actions">{profile.published && <a className="btn btn-ghost btn-icon btn-sm" href={shopUrl(profile.id)} target="_blank" rel="noopener noreferrer" aria-label={`Open ${profile.name} customer page`} title="Open customer page"><ExternalLink size={15} /></a>}<button type="button" className="btn btn-secondary btn-sm" onClick={() => onSelect(profile)}>{activeProfile.id === profile.id ? 'Selected' : 'Open'}</button><button type="button" className="btn btn-ghost btn-icon btn-sm danger" onClick={() => onDelete(profile)} aria-label={`Delete ${profile.name}`} title="Delete shop"><Trash2 size={15} /></button></span></td>
        </tr>; })}</tbody>
      </table></div></section>}
  </div>;
}
