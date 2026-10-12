import { useState } from 'react';
import { ArrowRight, ExternalLink, Plus, X } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { checkImageBudget } from '../utils/images';
import { INITIAL_PRESETS } from '../data/presets';
import Field from './Field';
import ShopLanding from './ShopLanding';
import { resolveMenuDesign } from '../data/menuDesign';

export default function AdminStudio({ businessProfile: p, setBusinessProfile, onNavigateToPrint, onNavigate }) {
  const accent = resolveMenuDesign(p.menuDesign).accent;
  const [error, setError] = useState('');
  const [tag, setTag] = useState('');
  const update = (field, value) => {
    const next = { ...p, [field]: value };
    if (field === 'logo' || field === 'coverImage') { try { checkImageBudget(next); } catch (e) { setError(e.message); return; } }
    setError(''); setBusinessProfile(next);
  };
  const field = (name, label, props = {}) => <Field id={`business-${name}`} label={label} value={p[name]} onChange={value => update(name, value)} {...props} />;
  const tags = p.quickTags || [];
  const addTag = event => { event.preventDefault(); const value = tag.trim().slice(0, 80); if (value && !tags.includes(value) && tags.length < 20) update('quickTags', [...tags, value]); setTag(''); };

  return <div className="sp-page">
    <header className="page-header">
      <div><h1>Business profile</h1><p>Branding, contact details and the review link shown on your customer page.</p></div>
      <div className="page-actions"><button type="button" className="btn btn-secondary" onClick={onNavigateToPrint}>Create QR poster<ArrowRight size={16} /></button></div>
    </header>
    {error && <p className="notice error" role="alert">{error}</p>}
    <div className="sp-grid-form">
      <div className="sp-stack">
        <section className="card">
          <div className="card-head"><div><h2>Business details</h2><p>How customers find and contact you.</p></div></div>
          <div className="form-grid">{field('name', 'Shop name', { required: true, maxLength: 150, placeholder: 'e.g. The Corner Café' })}{field('category', 'Business category', { placeholder: 'Café, restaurant, salon…' })}</div>
          {field('tagline', 'Tagline', { placeholder: 'Good coffee. Better company.' })}
          <div className="form-grid">{field('phone', 'Phone number', { type: 'tel' })}{field('email', 'Contact email', { type: 'email' })}</div>
          {field('address', 'Address')}{field('hours', 'Opening hours', { placeholder: 'Mon–Sat · 8:00 AM–9:00 PM' })}
        </section>
        <section className="card">
          <div className="card-head"><div><h2>Branding</h2><p>Logo, cover photo and accent colour for your pages.</p></div></div>
          <div className="form-grid"><ImageUpload id="business-logo-upload" label="Logo" value={p.logo} maxWidth={512} onChange={value => update('logo', value)} /><ImageUpload id="business-cover-upload" label="Cover photo" value={p.coverImage} maxWidth={1400} onChange={value => update('coverImage', value)} /></div>
          <div className="form-group"><span className="form-label">Brand colour</span><div className="brand-colour-row"><span className="brand-colour-swatch" style={{ background: accent }} aria-hidden="true" /><code>{accent.toUpperCase()}</code><button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('menu')}>Change in Menu → Design</button></div><p className="field-help">Your brand colour is your menu design’s accent, so your pages, menu and QR posters always match.</p></div>
        </section>
        <section className="card">
          <div className="card-head"><div><h2>Reviews & feedback</h2><p>Every customer sees the Google link, whatever rating they choose.</p></div></div>
          {field('googleReviewUrl', 'Google review URL', { type: 'url', placeholder: 'https://search.google.com/local/writereview?placeid=…' })}
          <div className="form-grid form-grid-end">{field('googlePlaceId', 'Google Place ID (optional)')}<div className="form-group"><button type="button" className="btn btn-secondary" disabled={!p.googlePlaceId?.trim()} onClick={() => update('googleReviewUrl', `https://search.google.com/local/writereview?placeid=${encodeURIComponent(p.googlePlaceId.trim())}`)}>Build review URL</button></div></div>
          {p.googleReviewUrl && /^https?:\/\//.test(p.googleReviewUrl) && <p className="field-help"><a href={p.googleReviewUrl} target="_blank" rel="noopener noreferrer">Test review link <ExternalLink size={12} /></a></p>}
          {field('customPrompt', 'Feedback question', { placeholder: 'How was your experience today?' })}
          {field('notePlaceholder', 'Note placeholder', { placeholder: 'Type your experience here…' })}
          <div className="form-group"><label className="form-label" htmlFor="quick-tag">Quick tags</label>
            <div className="chip-row">{tags.map(t => <span key={t} className="chip">{t}<button type="button" aria-label={`Remove ${t}`} onClick={() => update('quickTags', tags.filter(x => x !== t))}><X size={12} /></button></span>)}</div>
            <div className="inline-form"><input id="quick-tag" className="form-input" placeholder="e.g. Friendly staff" maxLength={80} value={tag} onChange={e => setTag(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addTag(e); }} /><button type="button" className="btn btn-secondary" disabled={!tag.trim() || tags.length >= 20} onClick={addTag}><Plus size={16} />Add</button></div>
            <p className="field-help">Customers can tap these when leaving feedback. Up to 20.</p>
          </div>
        </section>
        <section className="card">
          <div className="card-head"><div><h2>Start from a sample</h2><p>Fills in sample branding, prompts and tags. Your menu and settings are kept.</p></div></div>
          <div className="chip-row">{INITIAL_PRESETS.map(preset => <button type="button" className="chip chip-toggle" key={preset.id} onClick={() => { if (window.confirm(`Replace your branding with the “${preset.name}” sample?`)) setBusinessProfile({ ...p, ...preset, id: p.id, menu: p.menu, currency: p.currency, published: p.published, googleReviewUrl: p.googleReviewUrl, googlePlaceId: p.googlePlaceId }); }}>{preset.name.split('&')[0].trim()}</button>)}</div>
        </section>
      </div>
      <aside className="md-preview brand-preview"><div className="md-preview-bar"><span><span className="preview-live-dot" />Customer page preview</span></div><div className="md-preview-frame phone" aria-hidden="true" inert><div className="design-preview-scroll"><ShopLanding businessProfile={p} initialView="landing" preview /></div></div></aside>
    </div>
  </div>;
}
