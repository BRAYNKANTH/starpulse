import { useState } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, Circle, EyeOff, MessageSquare, Printer, QrCode, RefreshCw, Star, TableProperties, BarChart3 } from 'lucide-react';
import ColumnChart from './ColumnChart';
import Stars from './Stars';
import { compact, lastDays, relativeTime, shortDate, sumDays } from '../utils/format';
import ShopAvatar from './ShopAvatar';

const RANGES = [[7, '7 days'], [30, '30 days'], [90, '90 days']];

function Delta({ current, previous }) {
  if (!previous) return <span className="sp-delta muted">No earlier data</span>;
  const change = Math.round(((current - previous) / previous) * 100);
  const Icon = change >= 0 ? ArrowUpRight : ArrowDownRight;
  return <span className={`sp-delta ${change > 0 ? 'up' : change < 0 ? 'down' : ''}`}><Icon size={14} />{Math.abs(change)}% vs previous period</span>;
}

export default function Dashboard({ profile, savedProfile, profiles, overview, stats, onNavigate, onSelect, onRefresh, onPublish }) {
  const [range, setRange] = useState(30);
  const [view, setView] = useState('chart');
  const days = lastDays(range), previous = range <= 60 ? lastDays(range, range) : null;
  const visits = stats?.visits || { count: 0, daily: {} };
  const feedback = stats?.feedback || { total: 0, unread: 0, average: null, distribution: [0, 0, 0, 0, 0], daily: {}, recent: [] };
  const scans = sumDays(visits.daily, days), received = sumDays(feedback.daily, days);
  const series = days.map(key => ({ key, label: shortDate(key), value: visits.daily?.[key] || 0 }));
  const checklist = [
    { done: !!(profile.name && (profile.tagline || profile.address || profile.hours)), label: 'Add your shop details', page: 'register' },
    { done: !!(profile.logo || profile.coverImage), label: 'Upload a logo or cover photo', page: 'register' },
    { done: (profile.menu || []).length > 0, label: 'Add your first menu item', page: 'menu' },
    { done: !!profile.googleReviewUrl, label: 'Connect your Google review link', page: 'register' },
    { done: !!savedProfile?.published, label: 'Publish your customer page', action: onPublish },
  ];
  const completed = checklist.filter(item => item.done).length;
  const maxRating = Math.max(1, ...feedback.distribution);
  const live = !!savedProfile?.published;
  // Figures only mean something once customers can reach the shop; a draft shows what to do next instead.
  const hasData = live || visits.count > 0 || feedback.total > 0;

  return <div className="sp-page">
    <header className="page-header">
      <div><h1>Overview</h1><p>{profile.name} · {live ? 'Live' : 'Draft, only you can see it'}</p></div>
      {hasData && <div className="page-actions">
        <div className="segmented" role="group" aria-label="Date range">{RANGES.map(([value, label]) => <button key={value} type="button" aria-pressed={range === value} onClick={() => setRange(value)}>{label}</button>)}</div>
        <button type="button" className="btn btn-secondary btn-icon" aria-label="Refresh statistics" onClick={onRefresh}><RefreshCw size={16} /></button>
      </div>}
    </header>

    {!live && <section className="card draft-card">
      <EyeOff size={22} aria-hidden="true" />
      <div><h2>{profile.name} is a draft</h2><p>Only you can see it. When your menu and details look right, publish it so customers can open it from your QR code.</p></div>
      <div className="page-actions"><button type="button" className="btn btn-secondary" onClick={() => onNavigate('menu')}>Check the menu</button><button type="button" className="btn btn-primary" onClick={onPublish}>Publish now</button></div>
    </section>}

    {completed < checklist.length && <section className="card sp-checklist">
      <div className="card-head"><div><h2>Finish setting up {profile.name || 'your shop'}</h2><p>{completed} of {checklist.length} steps complete</p></div><div className="sp-progress" aria-hidden="true"><span style={{ width: `${(completed / checklist.length) * 100}%` }} /></div></div>
      <ul>{[...checklist].sort((a, b) => a.done - b.done).map(item => <li key={item.label} className={item.done ? 'done' : ''}>{item.done ? <Check size={16} aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}<span>{item.done && <span className="sr-only">Done: </span>}{item.label}</span>{!item.done && <button type="button" className="btn btn-ghost btn-sm" aria-label={`${item.action ? 'Do it now' : 'Start'}: ${item.label}`} onClick={() => item.action ? item.action() : onNavigate(item.page)}>{item.action ? 'Publish' : 'Start'}<ArrowRight size={14} aria-hidden="true" /></button>}</li>)}</ul>
    </section>}

    {hasData && <>
    <section className="sp-kpis" aria-label="Key figures">
      <div className="card sp-kpi"><span className="sp-kpi-label"><QrCode size={16} />QR scans</span><strong>{compact(scans)}</strong>{previous ? <Delta current={scans} previous={sumDays(visits.daily, previous)} /> : <span className="sp-delta muted">{compact(visits.count || 0)} all time</span>}</div>
      <div className="card sp-kpi"><span className="sp-kpi-label"><Star size={16} />Average rating</span><strong>{feedback.average ? feedback.average.toFixed(1) : '—'}</strong><span className="sp-delta muted">{feedback.total ? `From ${feedback.total.toLocaleString()} ${feedback.total === 1 ? 'response' : 'responses'}` : 'No ratings yet'}</span></div>
      <div className="card sp-kpi"><span className="sp-kpi-label"><MessageSquare size={16} />Feedback received</span><strong>{compact(received)}</strong>{previous ? <Delta current={received} previous={sumDays(feedback.daily, previous)} /> : <span className="sp-delta muted">{feedback.total.toLocaleString()} all time</span>}</div>
      <button type="button" className="card sp-kpi sp-kpi-link" onClick={() => onNavigate('inbox')}><span className="sp-kpi-label"><Circle size={16} />Unread feedback</span><strong>{feedback.unread}</strong><span className="sp-delta muted">Open inbox<ArrowRight size={14} /></span></button>
    </section>

    <div className="sp-grid-2-1">
      <section className="card">
        <div className="card-head"><div><h2>QR scans per day</h2><p>Last {range} days · includes test scans and bots</p></div>
          <div className="segmented" role="group" aria-label="Display as"><button type="button" aria-pressed={view === 'chart'} aria-label="Chart" onClick={() => setView('chart')}><BarChart3 size={15} /></button><button type="button" aria-pressed={view === 'table'} aria-label="Table" onClick={() => setView('table')}><TableProperties size={15} /></button></div>
        </div>
        {view === 'chart' ? (scans ? <ColumnChart data={series} unit="scans" /> : <div className="empty-state"><QrCode size={28} /><p>No scans in this period yet.</p><button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('qr')}><Printer size={15} />Print your QR code</button></div>)
          : <div className="table-wrap sp-chart-table"><table className="data-table"><thead><tr><th>Date</th><th className="num">Scans</th></tr></thead><tbody>{[...series].reverse().map(d => <tr key={d.key}><td>{d.label}</td><td className="num">{d.value.toLocaleString()}</td></tr>)}</tbody></table></div>}
      </section>
      <section className="card">
        <div className="card-head"><div><h2>Ratings</h2><p>All responses</p></div></div>
        {feedback.total ? <ul className="sp-rating-bars">{[5, 4, 3, 2, 1].map(rating => { const count = feedback.distribution[rating - 1]; return <li key={rating}><span className="sp-rating-key">{rating}<Star size={12} aria-hidden="true" /></span><span className="sp-rating-track"><span style={{ width: `${(count / maxRating) * 100}%` }} /></span><span className="sp-rating-value">{count} <small>({Math.round((count / feedback.total) * 100)}%)</small></span></li>; })}</ul>
          : <div className="empty-state"><Star size={28} /><p>Ratings appear when customers use your feedback page.</p></div>}
      </section>
    </div>

    <div className="sp-grid-2-1">
      <section className="card">
        <div className="card-head"><div><h2>Recent feedback</h2><p>Latest customer responses</p></div><button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('inbox')}>View all<ArrowRight size={14} /></button></div>
        {feedback.recent.length ? <ul className="sp-feed">{feedback.recent.map(item => <li key={item.id} className={item.read ? '' : 'unread'}>
          <div><Stars rating={item.rating} /><time dateTime={item.timestamp} title={new Date(item.timestamp).toLocaleString()}>{relativeTime(item.timestamp)}</time></div>
          <p>{item.note || item.selectedTags?.join(' · ') || <span className="muted">No written note</span>}</p>
        </li>)}</ul> : <div className="empty-state"><MessageSquare size={28} /><p>No feedback yet.</p></div>}
      </section>
      <section className="card">
        <div className="card-head"><div><h2>Quick actions</h2></div></div>
        <div className="sp-actions-list">
          <button type="button" onClick={() => onNavigate('menu')}><span>Edit menu</span><small>{(profile.menu || []).length} items</small><ArrowRight size={16} /></button>
          <button type="button" onClick={() => onNavigate('qr')}><span>QR code & table stands</span><small>{compact(visits.count || 0)} {visits.count === 1 ? 'scan' : 'scans'} all time</small><ArrowRight size={16} /></button>
          <button type="button" onClick={() => onNavigate('inbox')}><span>Read feedback</span><small>{feedback.unread} unread</small><ArrowRight size={16} /></button>
        </div>
      </section>
    </div>
    </>}

    {profiles.length > 1 && <section className="card card-flush">
      <div className="card-head"><div><h2>All shops</h2><p>Last {range} days</p></div></div>
      <div className="table-wrap"><table className="data-table"><thead><tr><th>Shop</th><th>Status</th><th className="num">Scans</th><th className="num">Rating</th><th className="num">Unread</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>
        {profiles.map(p => { const s = overview.find(o => o.id === p.id); return <tr key={p.id} className={p.id === profile.id ? 'selected' : ''}>
          <td><span className="sp-shop-cell"><ShopAvatar profile={p} showLogo={false} />{p.name}</span></td>
          <td><span className={`badge badge-${p.published ? 'success' : 'neutral'}`}>{p.published ? 'Live' : 'Draft'}</span></td>
          <td className="num">{sumDays(s?.visits.daily, days).toLocaleString()}</td>
          <td className="num">{s?.feedback.average ? s.feedback.average.toFixed(1) : '—'}</td>
          <td className="num">{s?.feedback.unread || 0}</td>
          <td className="num"><button type="button" className="btn btn-ghost btn-sm" onClick={() => onSelect(p)}>Open</button></td>
        </tr>; })}
      </tbody></table></div>
    </section>}
  </div>;
}
