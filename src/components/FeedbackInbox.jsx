import { useEffect, useMemo, useState } from 'react';
import { CheckCheck, Download, ExternalLink, Inbox, Mail, MailOpen, RefreshCw, Search, Trash2 } from 'lucide-react';
import { api } from '../data/api';
import { downloadBlob } from '../utils/export';
import { relativeTime } from '../utils/format';
import Stars from './Stars';

const PAGE_SIZE = 25;

export default function FeedbackInbox({ businessProfile, savedProfile, onChange, notify }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(() => Boolean(savedProfile));
  const [filters, setFilters] = useState({ status: 'all', rating: 'all', source: 'all', query: '' });
  const [shown, setShown] = useState(PAGE_SIZE);
  const path = `/admin/businesses/${businessProfile.id}/feedback`;
  // An unsaved shop has no server record: do not call the API for it, or
  // the server's "Shop not found" 404 surfaces as a red error banner.
  const isSaved = Boolean(savedProfile);
  useEffect(() => { if (!isSaved) return; let active = true; api(path).then(data => { if (active) setItems(data); }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [path, isSaved]);
  const refresh = async () => { if (!isSaved) return; setError(''); setLoading(true); try { setItems(await api(path)); onChange?.(); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  const filter = (key, value) => { setFilters(current => ({ ...current, [key]: value })); setShown(PAGE_SIZE); };

  const visible = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return items.filter(item => (filters.status === 'all' || (filters.status === 'unread') !== item.read)
      && (filters.rating === 'all' || (filters.rating === 'low' ? item.rating <= 3 : item.rating === Number(filters.rating)))
      && (filters.source === 'all' || (filters.source === 'google') === item.redirectedToGoogle)
      && (!query || `${item.note} ${item.selectedTags.join(' ')}`.toLowerCase().includes(query)));
  }, [items, filters]);
  const unread = items.filter(item => !item.read).length;
  const average = items.length ? items.reduce((sum, item) => sum + item.rating, 0) / items.length : null;

  const mark = async (ids, read) => {
    const previous = items;
    setItems(current => current.map(item => ids === 'all' || ids.includes(item.id) ? { ...item, read } : item));
    try { await api(path, { method: 'PATCH', body: JSON.stringify({ ids, read }) }); onChange?.(); }
    catch (e) { setItems(previous); setError(e.message); }
  };
  const remove = async item => {
    if (!window.confirm('Delete this feedback? This cannot be undone.')) return;
    try { await api(`${path}/${item.id}`, { method: 'DELETE' }); setItems(current => current.filter(i => i.id !== item.id)); onChange?.(); notify?.('Feedback deleted.'); }
    catch (e) { setError(e.message); }
  };
  const clear = async () => {
    if (!window.confirm(`Delete all ${items.length} responses for ${businessProfile.name || 'this shop'}? This cannot be undone.`)) return;
    try { await api(path, { method: 'DELETE' }); setItems([]); onChange?.(); notify?.('Feedback log cleared.'); } catch (e) { setError(e.message); }
  };
  const csv = () => {
    const escape = value => { const text = String(value ?? ''); return `"${(/^[=+@\-\t\r]/.test(text) ? "'" : '') + text.replaceAll('"', '""')}"`; };
    const rows = [['Rating', 'Tags', 'Note', 'Status', 'Read', 'Timestamp'], ...visible.map(item => [item.rating, item.selectedTags.join(', '), item.note, item.status, item.read ? 'Yes' : 'No', item.timestamp])];
    downloadBlob(new Blob(['﻿' + rows.map(row => row.map(escape).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }), `${businessProfile.id}-feedback.csv`);
  };

  if (!isSaved) return <div className="sp-page">
    <header className="page-header">
      <div><h1>Feedback</h1><p>Customer responses for {businessProfile.name || 'this shop'}.</p></div>
    </header>
    <div className="empty-state"><Inbox size={30} /><p>Save your shop first — feedback appears here once the shop is saved and its customer page is published.</p></div>
  </div>;

  return <div className="sp-page">
    <header className="page-header">
      <div><h1>Feedback</h1><p>Customer responses for {businessProfile.name || 'this shop'}. Google link clicks don’t confirm that a review was posted.</p></div>
      <div className="page-actions">
        <button type="button" className="btn btn-secondary btn-icon" aria-label="Refresh" onClick={refresh} disabled={loading}><RefreshCw size={16} /></button>
        <button type="button" className="btn btn-secondary" onClick={csv} disabled={!visible.length}><Download size={16} />Export CSV</button>
        <button type="button" className="btn btn-secondary" onClick={() => mark('all', true)} disabled={!unread}><CheckCheck size={16} />Mark all read</button>
      </div>
    </header>
    {error && <p className="notice error" role="alert">{error}</p>}

    <section className="sp-kpis sp-kpis-compact" aria-label="Feedback summary">
      <div className="card sp-kpi"><span className="sp-kpi-label">Total responses</span><strong>{items.length.toLocaleString()}</strong></div>
      <div className="card sp-kpi"><span className="sp-kpi-label">Unread</span><strong>{unread.toLocaleString()}</strong></div>
      <div className="card sp-kpi"><span className="sp-kpi-label">Average rating</span><strong>{average ? average.toFixed(1) : '—'}</strong></div>
      <div className="card sp-kpi"><span className="sp-kpi-label">Google link clicks</span><strong>{items.filter(i => i.redirectedToGoogle).length.toLocaleString()}</strong></div>
    </section>

    <section className="card card-flush">
      <div className="toolbar">
        <label className="search-field"><Search size={16} /><span className="sr-only">Search feedback</span><input type="search" placeholder="Search notes and tags…" value={filters.query} onChange={e => filter('query', e.target.value)} /></label>
        <div className="segmented" role="group" aria-label="Read status">{[['all', 'All'], ['unread', `Unread${unread ? ` (${unread})` : ''}`], ['read', 'Read']].map(([value, label]) => <button key={value} type="button" aria-pressed={filters.status === value} onClick={() => filter('status', value)}>{label}</button>)}</div>
        <label className="sr-only" htmlFor="feedback-rating">Rating</label>
        <select id="feedback-rating" className="form-input select-sm" value={filters.rating} onChange={e => filter('rating', e.target.value)}><option value="all">All ratings</option>{[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} star{r > 1 ? 's' : ''}</option>)}<option value="low">3 stars or less</option></select>
        <label className="sr-only" htmlFor="feedback-source">Type</label>
        <select id="feedback-source" className="form-input select-sm" value={filters.source} onChange={e => filter('source', e.target.value)}><option value="all">All types</option><option value="private">Private feedback</option><option value="google">Google link clicks</option></select>
      </div>

      {loading && !items.length ? <div className="empty-state"><p>Loading feedback…</p></div>
        : !visible.length ? <div className="empty-state"><Inbox size={30} /><p>{items.length ? 'No feedback matches these filters.' : 'No feedback yet. Responses from your customer page appear here.'}</p></div>
        : <ul className="sp-inbox">{visible.slice(0, shown).map(item => <li key={item.id} className={item.read ? '' : 'unread'}>
          <span className="sp-unread-dot" aria-hidden="true" />
          <div className="sp-inbox-body">
            <div className="sp-inbox-meta"><Stars rating={item.rating} />{item.redirectedToGoogle ? <span className="badge badge-info"><ExternalLink size={12} />Google link clicked</span> : <span className="badge badge-neutral">Private</span>}{!item.read && <span className="sr-only">Unread</span>}<time dateTime={item.timestamp} title={new Date(item.timestamp).toLocaleString()}>{relativeTime(item.timestamp)}</time></div>
            {item.selectedTags.length > 0 && <div className="chip-row">{item.selectedTags.map(tag => <span key={tag} className="chip">{tag}</span>)}</div>}
            <p className={item.note ? '' : 'muted'}>{item.note || 'No written note'}</p>
          </div>
          <div className="sp-row-actions">
            <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={item.read ? 'Mark as unread' : 'Mark as read'} title={item.read ? 'Mark as unread' : 'Mark as read'} onClick={() => mark([item.id], !item.read)}>{item.read ? <Mail size={16} /> : <MailOpen size={16} />}</button>
            <button type="button" className="btn btn-ghost btn-icon btn-sm danger" aria-label="Delete feedback" title="Delete" onClick={() => remove(item)}><Trash2 size={16} /></button>
          </div>
        </li>)}</ul>}
      {visible.length > shown && <div className="card-foot"><span className="muted">Showing {shown} of {visible.length}</span><button type="button" className="btn btn-secondary btn-sm" onClick={() => setShown(n => n + PAGE_SIZE)}>Load more</button></div>}
    </section>

    {items.length > 0 && <section className="card danger-zone"><div><h2>Clear feedback log</h2><p>Permanently delete every response for this shop.</p></div><button type="button" className="btn btn-danger" onClick={clear}><Trash2 size={16} />Delete all</button></section>}
  </div>;
}
