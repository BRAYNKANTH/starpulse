import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, Download, ExternalLink, Globe, Printer, Radio, Smartphone, Star, Sparkles, Wifi } from 'lucide-react';
import { contrastRatio, normalizePosterDesign, normalizeQrDesign, qrPayload, QR_PRESETS } from '../data/qrDesign';
import { exportPoster, standaloneClone } from '../utils/export';

// One page for the shop's QR code: where it goes, how it looks, and the printed stand or poster.
// Everything here is saved with the shop, so a printed design is still there next time.

const DESTINATIONS = [
  { id: 'menu', name: 'Your menu', hint: 'Best for tables and counters.' },
  { id: 'landing', name: 'Your shop page', hint: 'Opening hours, contact details and the menu.' },
  { id: 'review', name: 'Feedback page', hint: 'Ask customers how their visit was.' },
  { id: 'url', name: 'Another website', hint: 'For example your delivery or booking page.' },
];
const HEADLINES = { menu: 'Scan to view our menu', landing: 'Scan to explore our shop', review: 'Scan to share your feedback', url: 'Scan to visit us online' };
const SUBTITLE = 'Our menu, opening hours and feedback in one place.';
const THEMES = [
  { id: 'bright', css: 'google_deluxe', name: 'Bright', description: 'White card with a strip in your brand colour', swatch: 'google-swatch', mark: <span aria-hidden="true">Aa</span> },
  { id: 'dark_luxe', css: 'dark_luxe', name: 'Obsidian & gold', description: 'Dark card with gold accents', swatch: 'dark-swatch', mark: <Star size={12} fill="#F59E0B" color="#F59E0B" /> },
  { id: 'minimal_stand', css: 'minimal_stand', name: 'Minimal', description: 'Black and white, high contrast', swatch: 'minimal-swatch', mark: <span>Aa</span> },
  { id: 'vibrant_neon', css: 'vibrant_neon', name: 'Neon', description: 'Purple-to-pink gradient', swatch: 'neon-swatch', mark: <Sparkles size={12} color="#ffffff" /> },
  { id: 'warm_bistro', css: 'warm_bistro', name: 'Warm bistro', description: 'Cream and burgundy', swatch: 'bistro-swatch', mark: <span aria-hidden="true">☕</span> },
];
const FORMATS = [['tabletop', 'Table stand · 4×6 in'], ['tent', 'Tent card · A5, folds in half'], ['sticker', 'Sticker · 3×3 in'], ['poster', 'Wall poster · A4']];
const OTHER_TYPES = [{ id: 'url', name: 'Website', icon: Globe }, { id: 'whatsapp', name: 'WhatsApp', icon: Smartphone }, { id: 'wifi', name: 'Wi-Fi', icon: Wifi }];

function useDownload() {
  const [file, setFile] = useState(null);
  useEffect(() => () => { if (file) URL.revokeObjectURL(file.url); }, [file]);
  const deliver = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    setFile({ url, filename });
    const link = document.createElement('a'); link.href = url; link.download = filename;
    document.body.appendChild(link); link.click(); link.remove();
  };
  return [file, deliver];
}

// The QR artwork on its own (code, frame and caption), used for PNG and SVG downloads.
function QrArt({ artRef, value, design, logo }) {
  return <div ref={artRef} className={`bqr-art bqr-frame-${design.frame}`} style={{ background: design.frame === 'none' ? design.background : design.frameColor, borderRadius: design.rounded ? 20 : 0 }}>
    <QRCodeSVG value={value} size={300} level="H" marginSize={4} fgColor={design.foreground} bgColor={design.background} imageSettings={design.showLogo && logo ? { src: logo, height: 42, width: 42, excavate: true } : undefined} />
    <span className="bqr-caption" style={{ color: contrastRatio('#ffffff', design.frameColor) >= 4.5 ? '#ffffff' : '#172033' }}>{design.label}</span>
  </div>;
}

async function svgFile(node, design) {
  const code = await standaloneClone(node.querySelector('svg'));
  const framed = design.frame !== 'none', labelled = design.frame === 'label';
  const ns = 'http://www.w3.org/2000/svg';
  const wrapper = document.createElementNS(ns, 'svg');
  const height = labelled ? 394 : 336;
  wrapper.setAttribute('xmlns', ns); wrapper.setAttribute('width', '336'); wrapper.setAttribute('height', String(height)); wrapper.setAttribute('viewBox', `0 0 336 ${height}`);
  const rect = document.createElementNS(ns, 'rect');
  rect.setAttribute('width', '336'); rect.setAttribute('height', String(height)); rect.setAttribute('rx', design.rounded ? '20' : '0'); rect.setAttribute('fill', framed ? design.frameColor : design.background); wrapper.appendChild(rect);
  code.setAttribute('x', '18'); code.setAttribute('y', '18'); code.setAttribute('width', '300'); code.setAttribute('height', '300'); code.style.width = '300px'; code.style.height = '300px'; wrapper.appendChild(code);
  if (labelled) {
    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', '168'); text.setAttribute('y', '360'); text.setAttribute('text-anchor', 'middle'); text.setAttribute('font-family', 'Arial, sans-serif'); text.setAttribute('font-weight', '700');
    text.setAttribute('fill', contrastRatio('#ffffff', design.frameColor) >= 4.5 ? '#ffffff' : '#172033');
    text.setAttribute('font-size', String(Math.min(14, 280 / Math.max(1, design.label.length * .65))));
    text.textContent = design.label; wrapper.appendChild(text);
  }
  return new Blob([new XMLSerializer().serializeToString(wrapper)], { type: 'image/svg+xml' });
}

// Static codes for things that are not the shop: the content is printed into the code itself and never saved.
function OtherQrCodes({ phone, design }) {
  const [type, setType] = useState('url');
  const [fields, setFields] = useState({ url: '', phone: phone || '', message: '', ssid: '', password: '', security: 'WPA', hidden: false });
  const [error, setError] = useState('');
  const art = useRef(null);
  const [file, deliver] = useDownload();
  let payload = '', problem = '';
  try { payload = qrPayload(type, fields); } catch (e) { problem = e.message; }
  const set = (key, value) => setFields(current => ({ ...current, [key]: value }));
  const input = (label, key, inputType = 'text') => <div className="form-group"><label className="form-label" htmlFor={`other-${key}`}>{label}</label><input id={`other-${key}`} className="form-input" type={inputType} value={fields[key]} onChange={e => set(key, e.target.value)} /></div>;
  const download = async () => { setError(''); try { deliver(await exportPoster(art.current), `${type}-qr.png`); } catch (e) { setError(e.message); } };
  return <details className="card qp-other">
    <summary><span><strong>Other QR codes</strong><small>A website, a WhatsApp chat or your Wi-Fi. These codes can’t be changed after printing.</small></span></summary>
    <div className="qp-other-body">
      <div>
        <div className="segmented" role="group" aria-label="Code type">{OTHER_TYPES.map(({ id, name, icon: Icon }) => <button key={id} type="button" aria-pressed={type === id} onClick={() => setType(id)}><Icon size={15} aria-hidden="true" />{name}</button>)}</div>
        <div className="qp-other-fields">
          {type === 'url' && input('Website address', 'url', 'url')}
          {type === 'whatsapp' && <>{input('Phone number with country code', 'phone', 'tel')}{input('Message to start the chat (optional)', 'message')}</>}
          {type === 'wifi' && <>{input('Network name', 'ssid')}{input('Password', 'password', 'password')}
            <div className="form-group"><label className="form-label" htmlFor="other-security">Security</label><select id="other-security" className="form-input" value={fields.security} onChange={e => set('security', e.target.value)}><option value="WPA">WPA / WPA2 / WPA3</option><option value="WEP">WEP</option><option value="nopass">Open network</option></select></div>
            <label className="toggle-label"><input type="checkbox" checked={fields.hidden} onChange={e => set('hidden', e.target.checked)} />Hidden network</label></>}
        </div>
        <p className="field-help">Nothing typed here is saved, including Wi-Fi passwords.</p>
      </div>
      <div className="qp-other-preview">
        <QrArt artRef={art} value={payload || 'https://example.com'} design={{ ...design, frame: 'none', showLogo: false }} />
        {(fields.url || fields.ssid || type === 'whatsapp') && problem && <p className="notice warning">{problem}</p>}
        {error && <p className="notice error" role="alert">{error}</p>}
        <button type="button" className="btn btn-secondary" disabled={!!problem} onClick={download}><Download size={16} aria-hidden="true" />Download PNG</button>
        {file && <a className="field-help" href={file.url} download={file.filename}>Download again: {file.filename}</a>}
      </div>
    </div>
  </details>;
}

export default function QrPrintStudio({ businessProfile: profile, setBusinessProfile, savedProfile, dirty, onPublish }) {
  const design = normalizeQrDesign(profile.qrDesign);
  const poster = normalizePosterDesign(profile.posterDesign);
  const destination = profile.qrDestination || 'landing';
  const [view, setView] = useState('poster');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [file, deliver] = useDownload();
  const art = useRef(null), posterRef = useRef(null);

  const change = patch => setBusinessProfile({ ...profile, ...patch });
  const style = patch => change({ qrDesign: { ...design, ...patch } });
  const setPoster = patch => change({ posterDesign: { ...poster, ...patch } });

  const link = new URL(`/q/${profile.id}`, window.location.origin).href;
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
  const contrastProblem = contrastRatio(design.foreground, design.background) < 4.5 ? 'The QR dots need more contrast with the background, or some phones won’t scan it. Use dark dots on a light background.' : '';
  const urlProblem = destination === 'url' && !/^https:\/\//.test(profile.qrUrl || '') ? 'Enter the full website address, starting with https://' : '';
  const blocked = !savedProfile?.published ? 'publish' : dirty ? 'save' : '';
  const headline = poster.headline || HEADLINES[destination];
  const subtitle = poster.subtitle || SUBTITLE;
  const theme = THEMES.find(t => t.id === poster.theme) || THEMES[0];
  const posterBackground = poster.theme === 'dark_luxe' ? '#0F172A' : '#FFFFFF';
  const accent = profile.accentColor || '#385e43';

  const copyLink = async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); } };
  const run = async action => { setBusy(true); setError(''); try { await action(); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const downloadCode = format => run(async () => deliver(format === 'png' ? await exportPoster(art.current) : await svgFile(art.current, design), `${profile.id}-qr.${format}`));
  const downloadPoster = () => run(async () => deliver(await exportPoster(posterRef.current), `${profile.id}-${poster.format}.png`));

  const face = (compact = false) => <>
    {poster.theme === 'bright' && <div className="google-top-color-strip" aria-hidden="true"><span style={{ background: accent }} /></div>}
    {poster.theme === 'dark_luxe' && <div className="dark-luxe-accent-glow" />}
    <div className="poster-header-block">
      {profile.logo && <div className={`poster-logo-wrapper shape-${poster.logoShape} size-${poster.logoSize}`}><img src={profile.logo} alt={profile.name} className="poster-business-logo" /></div>}
      <h2 className="poster-business-name">{profile.name}</h2>
      {profile.tagline && !compact && <p className="poster-business-tagline">{profile.tagline}</p>}
    </div>
    <div className="poster-cta-text-block"><h3 className="poster-main-title">{headline}</h3>{!compact && <p className="poster-subtitle">{subtitle}</p>}</div>
    <div className="poster-qr-frame">
      <QRCodeSVG value={link} size={poster.format === 'sticker' ? 150 : poster.format === 'poster' ? 220 : poster.format === 'tabletop' ? 216 : compact ? 108 : 190} level="H" marginSize={4} fgColor={contrastRatio(design.foreground, posterBackground) >= 4.5 ? design.foreground : posterBackground === '#FFFFFF' ? '#172033' : '#F59E0B'} bgColor={posterBackground}
        imageSettings={design.showLogo && profile.logo ? { src: profile.logo, height: poster.format === 'sticker' ? 30 : 38, width: poster.format === 'sticker' ? 30 : 38, excavate: true } : undefined} />
      <div className="poster-direct-link-badge"><ExternalLink size={12} color="#4285F4" aria-hidden="true" /><span>{DESTINATIONS.find(d => d.id === destination)?.name}</span></div>
    </div>
    {poster.showNfc && <div className="nfc-tap-icon-row">
      <div className="nfc-pulse-ring"><Radio size={18} className="nfc-radio-icon" /></div>
      <div className="nfc-text-wrapper"><span className="nfc-bold-label">SCAN THE CODE OR TAP YOUR PHONE HERE</span></div>
      <Smartphone size={18} className="nfc-phone-icon" />
    </div>}
  </>;

  return <div className="sp-page print-page">
    <header className="page-header no-print"><div><h1>QR & print</h1><p>Your shop’s QR code: where it goes, how it looks, and the stand or poster you print.</p></div></header>
    <div className="print-layout">
      <div className="sp-stack no-print">
        <section className="card">
          <div className="card-head"><div><h2>Where the QR code goes</h2><p>Print once. Change this any time and the same printed code follows.</p></div></div>
          <div className="qp-destinations" role="radiogroup" aria-label="QR code destination">
            {DESTINATIONS.map(d => <label key={d.id} className={`qp-destination ${destination === d.id ? 'selected' : ''}`}>
              <input type="radio" name="qr-destination" value={d.id} checked={destination === d.id} onChange={() => change({ qrDestination: d.id })} />
              <span><strong>{d.name}</strong><small>{d.hint}</small></span>
            </label>)}
          </div>
          {destination === 'url' && <div className="form-group qp-url"><label className="form-label" htmlFor="qr-url">Website address</label><input id="qr-url" className="form-input" type="url" placeholder="https://" value={profile.qrUrl || ''} onChange={e => change({ qrUrl: e.target.value })} />{urlProblem && profile.qrUrl && <p className="field-help">{urlProblem}</p>}</div>}
          <div className="print-destination">
            <div><span className="print-destination-label">Your QR link</span><a className="print-destination-url" href={link} target="_blank" rel="noopener noreferrer">{link}</a></div>
            <div className="print-destination-actions"><button type="button" className="btn btn-secondary btn-sm" onClick={copyLink}>{copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}{copied ? 'Link copied' : 'Copy link'}</button></div>
            <span className="sr-only" role="status">{copied ? 'Link copied to the clipboard' : ''}</span>
          </div>
          <p className="field-help">To use an NFC tag, write this link to it with any NFC app.</p>
          {local && <p className="notice warning">You’re on a test copy of the studio on this computer. Download and print from your live website, or customers’ phones won’t reach the code.</p>}
        </section>

        <section className="card">
          <div className="card-head"><div><h2>QR code style</h2><p>Colours, frame and logo for the code itself.</p></div></div>
          <div className="qp-presets" role="group" aria-label="Ready-made styles">{QR_PRESETS.map(preset => <button type="button" key={preset.id} onClick={() => style(preset)}><span style={{ background: preset.frameColor }} aria-hidden="true" />{preset.name}</button>)}</div>
          <div className="form-grid">
            {[['foreground', 'Code colour'], ['background', 'Background']].map(([key, label]) => <div className="form-group" key={key}><label className="form-label" htmlFor={`qr-${key}`}>{label}</label><div className="inline-form"><input id={`qr-${key}`} type="color" className="form-input" value={design[key]} onChange={e => style({ [key]: e.target.value })} /><code>{design[key].toUpperCase()}</code></div></div>)}
            <div className="form-group"><label className="form-label" htmlFor="qr-frame">Frame</label><select id="qr-frame" className="form-input" value={design.frame} onChange={e => style({ frame: e.target.value })}><option value="none">No frame</option><option value="border">Coloured border</option><option value="label">Border with a caption</option></select></div>
            {design.frame !== 'none' && <div className="form-group"><label className="form-label" htmlFor="qr-frame-colour">Frame colour</label><div className="inline-form"><input id="qr-frame-colour" type="color" className="form-input" value={design.frameColor} onChange={e => style({ frameColor: e.target.value })} /><code>{design.frameColor.toUpperCase()}</code></div></div>}
            {design.frame === 'label' && <div className="form-group"><label className="form-label" htmlFor="qr-caption">Caption</label><input id="qr-caption" className="form-input" maxLength={60} value={design.label} onChange={e => style({ label: e.target.value })} /></div>}
          </div>
          <div className="qp-toggles">
            <label className="toggle-label"><input type="checkbox" checked={design.rounded} onChange={e => style({ rounded: e.target.checked })} />Rounded corners</label>
            <label className="toggle-label"><input type="checkbox" checked={design.showLogo} disabled={!profile.logo} onChange={e => style({ showLogo: e.target.checked })} />Put my logo in the middle{!profile.logo && <small> (add a logo on Business profile first)</small>}</label>
          </div>
          {contrastProblem && <p className="notice warning">{contrastProblem}</p>}
        </section>

        <section className="card">
          <div className="card-head"><div><h2>Printed stand or poster</h2><p>Pick a look and size, then download or print.</p></div></div>
          <div className="poster-theme-selector-grid" role="group" aria-label="Poster style">
            {THEMES.map(t => <button key={t.id} type="button" aria-pressed={poster.theme === t.id} className={`poster-theme-btn ${poster.theme === t.id ? 'active' : ''}`} onClick={() => setPoster({ theme: t.id })}>
              <span className={`theme-preview-swatch ${t.swatch}`} aria-hidden="true">{t.mark}</span>
              <span className="theme-btn-info"><span className="theme-name">{t.name}</span><span className="theme-desc">{t.description}</span></span>
              {poster.theme === t.id && <Check size={16} className="theme-check" aria-hidden="true" />}
            </button>)}
          </div>
          <div className="form-grid print-options">
            <div className="form-group"><label className="form-label" htmlFor="poster-format">Size</label><select id="poster-format" className="form-input" value={poster.format} onChange={e => setPoster({ format: e.target.value })}>{FORMATS.map(([v, text]) => <option key={v} value={v}>{text}</option>)}</select></div>
            {profile.logo && <div className="form-group"><label className="form-label" htmlFor="poster-logo-shape">Logo shape</label><select id="poster-logo-shape" className="form-input" value={poster.logoShape} onChange={e => setPoster({ logoShape: e.target.value })}><option value="squircle">Rounded square</option><option value="circle">Circle</option><option value="banner">Wide banner</option></select></div>}
            <div className="form-group"><label className="form-label" htmlFor="poster-title">Headline</label><input id="poster-title" className="form-input" maxLength={60} placeholder={HEADLINES[destination]} value={poster.headline} onChange={e => setPoster({ headline: e.target.value })} /></div>
            <div className="form-group"><label className="form-label" htmlFor="poster-subtitle">Line under the headline</label><input id="poster-subtitle" className="form-input" maxLength={90} placeholder={SUBTITLE} value={poster.subtitle} onChange={e => setPoster({ subtitle: e.target.value })} /></div>
          </div>
          <label className="toggle-label"><input type="checkbox" checked={poster.showNfc} onChange={e => setPoster({ showNfc: e.target.checked })} />Add “tap your phone here” (only if you stick an NFC tag on the stand)</label>
        </section>

        <OtherQrCodes phone={profile.phone} design={design} />
      </div>

      <div className="poster-preview-stage" aria-label="Preview">
        <div className="poster-preview-stage-header no-print qp-preview-head">
          <div className="segmented" role="group" aria-label="Preview"><button type="button" aria-pressed={view === 'poster'} onClick={() => setView('poster')}>{FORMATS.find(([v]) => v === poster.format)[1].split(' ·')[0]}</button><button type="button" aria-pressed={view === 'code'} onClick={() => setView('code')}>QR code only</button></div>
        </div>
        {view === 'code' ? <div className="qp-code-preview"><QrArt artRef={art} value={link} design={design} logo={profile.logo} /></div>
          : poster.format === 'tent' ? <div ref={posterRef} className="tent-sheet-wrapper">
            <div className={`poster-preview-card poster-theme-${theme.css} tent-panel tent-panel-upside-down`}>{face(true)}</div>
            <div className="tent-fold-line no-print"><span>✂ Fold here. The top half prints upside down so both sides read the right way up.</span></div>
            <div className={`poster-preview-card poster-theme-${theme.css} tent-panel`}>{face(true)}</div>
          </div>
          : <div ref={posterRef} className={`poster-preview-card poster-theme-${theme.css} poster-format-${poster.format}`}>{face()}</div>}

        <div className="qp-actions no-print">
          {blocked ? <div className="notice warning qp-blocked"><span>{blocked === 'publish' ? 'Publish your shop first. Customers can only open the code once it’s live.' : 'Save your changes first, so the printed code matches your live shop.'}</span>{blocked === 'publish' && <button type="button" className="btn btn-primary btn-sm" onClick={onPublish}>Publish</button>}</div>
            : view === 'poster' ? <div className="page-actions"><button type="button" className="btn btn-primary" disabled={busy || !!urlProblem} onClick={downloadPoster}><Download size={16} aria-hidden="true" />{busy ? 'Preparing…' : 'Download poster'}</button><button type="button" className="btn btn-secondary" disabled={busy || !!urlProblem} onClick={() => window.print()}><Printer size={16} aria-hidden="true" />Print</button></div>
              : <div className="page-actions"><button type="button" className="btn btn-primary" disabled={busy || !!contrastProblem || !!urlProblem} onClick={() => downloadCode('png')}><Download size={16} aria-hidden="true" />{busy ? 'Preparing…' : 'Download PNG'}</button><button type="button" className="btn btn-secondary" disabled={busy || !!contrastProblem || !!urlProblem} onClick={() => downloadCode('svg')}>Download SVG</button></div>}
          {urlProblem && !blocked && <p className="notice warning">{urlProblem}</p>}
          {error && <p className="notice error" role="alert">{error}</p>}
          {file && <a className="field-help" href={file.url} download={file.filename}>Download again: {file.filename}</a>}
          <p className="field-help">Scan it with your phone before printing a batch.</p>
        </div>
      </div>
    </div>
  </div>;
}
