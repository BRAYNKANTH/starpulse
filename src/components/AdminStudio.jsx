import { useState } from 'react';
import { ArrowRight, ExternalLink, Plus, X } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { checkImageBudget } from '../utils/images';
import { INITIAL_PRESETS } from '../data/presets';
import Field from './Field';
import ShopLanding from './ShopLanding';
import { resolveMenuDesign } from '../data/menuDesign';
import { api } from '../data/api';
import { isShortGoogleLink, placeFromGoogleText } from '../data/googlePlace';

export default function AdminStudio({ businessProfile: p, setBusinessProfile, onNavigateToPrint }) {
  const resolved = resolveMenuDesign(p.menuDesign);
  const accent = resolved.accent;
  // The brand colour is the menu design's accent, so the pages, menu and posters always match.
  const setAccent = value => setBusinessProfile({ ...p, menuDesign: { ...p.menuDesign, accent: value } });
  const [error, setError] = useState('');
  const [tag, setTag] = useState('');
  const [finding, setFinding] = useState(false);
  const [lookup, setLookup] = useState({ text: '', ok: true });
  const update = (field, value) => {
    const next = { ...p, [field]: value };
    if (field === 'logo' || field === 'coverImage') { try { checkImageBudget(next); } catch (e) { setError(e.message); return; } }
    setError(''); setBusinessProfile(next);
  };
  const field = (name, label, props = {}) => <Field id={`business-${name}`} label={label} value={p[name]} onChange={value => update(name, value)} {...props} />;
  const tags = p.quickTags || [];
  const addTag = event => { event.preventDefault(); const value = tag.trim().slice(0, 80); if (value && !tags.includes(value) && tags.length < 20) update('quickTags', [...tags, value]); setTag(''); };

  // Builds the review link from a pasted Google Maps link (long or the short Share link) or a Place ID.
  const buildReviewLink = async () => {
    const text = (p.googlePlaceId || '').trim();
    let found = placeFromGoogleText(text), message = '';
    if (!found && isShortGoogleLink(text)) {
      setFinding(true);
      try { found = await api('/google/place', { method: 'POST', body: JSON.stringify({ url: text }) }); } catch (e) { message = e.message; } finally { setFinding(false); }
    }
    if (!found) { setLookup({ text: message || 'Could not find a place in that. Paste your shop’s Google Maps link (from the Share button) or its Place ID.', ok: false }); return; }
    setError(''); setBusinessProfile({ ...p, googlePlaceId: found.placeId, googleReviewUrl: found.reviewUrl });
    setLookup({ text: 'Review link built. Press “Test review link” to check it opens your shop’s review box.', ok: true });
  };

  return <div className="sp-page">
    <header className="page-header">
      <div><h1>Business profile</h1><p>Branding, contact details and the review link shown on your customer page.</p></div>
      <div className="page-actions"><button type="button" className="btn btn-secondary" onClick={onNavigateToPrint}>QR code & stands<ArrowRight size={16} /></button></div>
    </header>
    {error && <p className="notice error" role="alert">{error}</p>}
    <div className="sp-grid-form">
      <div className="sp-stack">
        <section className="card">
          <div className="card-head"><div><h2>Business details</h2><p>How customers find and contact you.</p></div></div>
          <div className="form-grid">{field('name', 'Shop name', { required: true, maxLength: 150, placeholder: 'e.g. The Corner Café' })}{field('category', 'Type of business', { placeholder: 'Café, restaurant, bakery…' })}</div>
          {field('tagline', 'Tagline', { placeholder: 'Good coffee. Better company.' })}
          <div className="form-grid">{field('phone', 'Phone number', { type: 'tel' })}{field('email', 'Contact email', { type: 'email' })}</div>
          {field('address', 'Address')}{field('hours', 'Opening hours', { placeholder: 'Mon–Sat · 8:00 AM–9:00 PM' })}
        </section>
        <section className="card">
          <div className="card-head"><div><h2>Branding</h2><p>Your logo, cover photo and brand colour, used on your pages, menu and printed stands.</p></div></div>
          <div className="form-grid"><ImageUpload id="business-logo-upload" label="Logo" value={p.logo} maxWidth={512} onChange={value => update('logo', value)} /><ImageUpload id="business-cover-upload" label="Cover photo" value={p.coverImage} maxWidth={1400} onChange={value => update('coverImage', value)} /></div>
          <div className="form-group"><label className="form-label" htmlFor="brand-colour">Brand colour</label><div className="brand-colour-row"><input id="brand-colour" type="color" className="form-input" value={accent} onChange={e => setAccent(e.target.value)} /><code>{accent.toUpperCase()}</code>{p.menuDesign?.accent && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAccent('')}>Use the menu template’s colour</button>}</div><p className="field-help">Used for buttons, prices and highlights. {p.menuDesign?.accent ? 'Your own colour.' : `Currently the ${resolved.palette.name} template’s colour.`}</p></div>
        </section>
        <section className="card">
          <div className="card-head"><div><h2>Reviews & feedback</h2><p>Every customer sees the Google link, whatever rating they choose.</p></div></div>
          {field('googleReviewUrl', 'Google review link', { type: 'url', placeholder: 'https://search.google.com/local/writereview?placeid=…' })}
          <details className="help-details"><summary>Don’t have the link?</summary>
            <p className="field-help">Easiest: open your shop in Google Maps, tap <strong>Share</strong>, copy the link and paste it below. We find your shop and build the review link for you. A Place ID works too. Or, on your Google Business Profile, choose <strong>Ask for reviews</strong> and paste that link above.</p>
            <div className="form-grid form-grid-end">{field('googlePlaceId', 'Google Maps link or Place ID', { placeholder: 'https://maps.app.goo.gl/… or ChIJ…' })}<div className="form-group"><button type="button" className="btn btn-secondary" disabled={!p.googlePlaceId?.trim() || finding} onClick={buildReviewLink}>{finding ? 'Looking…' : 'Build the link'}</button></div></div>
            {lookup.text && <p className={lookup.ok ? 'field-help' : 'notice error'} role={lookup.ok ? 'status' : 'alert'}>{lookup.text}</p>}
          </details>
          {p.googleReviewUrl && /^https?:\/\//.test(p.googleReviewUrl) && <p className="field-help"><a href={p.googleReviewUrl} target="_blank" rel="noopener noreferrer">Test review link <ExternalLink size={12} /></a></p>}
          {field('customPrompt', 'Question customers see', { placeholder: 'How was your experience today?' })}
          {field('notePlaceholder', 'Hint inside the comment box', { placeholder: 'Type your experience here…' })}
          <div className="form-group"><label className="form-label" htmlFor="quick-tag">Quick replies customers can tap</label>
            <div className="chip-row">{tags.map(t => <span key={t} className="chip">{t}<button type="button" aria-label={`Remove ${t}`} onClick={() => update('quickTags', tags.filter(x => x !== t))}><X size={12} /></button></span>)}</div>
            <div className="inline-form"><input id="quick-tag" className="form-input" placeholder="e.g. Friendly staff" maxLength={80} value={tag} onChange={e => setTag(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addTag(e); }} /><button type="button" className="btn btn-secondary" disabled={!tag.trim() || tags.length >= 20} onClick={addTag}><Plus size={16} />Add</button></div>
            <p className="field-help">For example “Friendly staff” or “Great coffee”. Up to 20.</p>
          </div>
        </section>
        <section className="card">
          <div className="card-head"><div><h2>Fill in example text</h2><p>Replaces your tagline, feedback question and quick replies with an example. Your name, menu, photos and links are kept.</p></div></div>
          <div className="chip-row">{INITIAL_PRESETS.map(preset => <button type="button" className="chip chip-toggle" key={preset.id} onClick={() => { if (window.confirm(`Replace your tagline, feedback question and quick replies with the “${preset.name}” example?`)) setBusinessProfile({ ...p, tagline: preset.tagline, customPrompt: preset.customPrompt, notePlaceholder: preset.notePlaceholder, quickTags: preset.quickTags, category: p.category || preset.category }); }}>{preset.name.split('&')[0].trim()}</button>)}</div>
        </section>
      </div>
      <aside className="md-preview brand-preview"><div className="md-preview-bar"><span><span className="preview-live-dot" />Customer page preview</span></div><div className="md-preview-frame phone" aria-hidden="true" inert><div className="design-preview-scroll"><ShopLanding businessProfile={p} initialView="landing" preview /></div></div></aside>
    </div>
  </div>;
}
