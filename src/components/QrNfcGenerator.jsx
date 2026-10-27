import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, Radio, Star, ExternalLink, Smartphone, Sparkles, Check, ArrowRight, Copy } from 'lucide-react';

import { standaloneClone, exportPoster } from '../utils/export';

const GOOGLE_G_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%234285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="%2334A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="%23FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/><path fill="%23EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>`;

const NFC_ICON_DATA = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%232563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18a10 10 0 0 1 0-12"/><path d="M10 15a6 6 0 0 1 0-6"/><path d="M14 12a2 2 0 0 1 0 0"/><circle cx="12" cy="12" r="1" fill="%232563EB"/></svg>`;

const THEMES = [
  { id: 'google_deluxe', name: 'Google colours', description: 'White card with the four-colour strip', swatch: 'google-swatch', mark: <><span style={{ color: '#4285F4' }}>G</span><span style={{ color: '#EA4335' }}>o</span></> },
  { id: 'dark_luxe', name: 'Obsidian & gold', description: 'Dark card with gold accents', swatch: 'dark-swatch', mark: <Star size={12} fill="#F59E0B" color="#F59E0B" /> },
  { id: 'minimal_stand', name: 'Minimal', description: 'Black and white, high contrast', swatch: 'minimal-swatch', mark: <span>Aa</span> },
  { id: 'vibrant_neon', name: 'Neon', description: 'Purple-to-pink gradient', swatch: 'neon-swatch', mark: <Sparkles size={12} color="#ffffff" /> },
  { id: 'warm_bistro', name: 'Warm bistro', description: 'Cream and burgundy', swatch: 'bistro-swatch', mark: <span aria-hidden="true">☕</span> },
];
const QR_COLOURS = { dark_luxe: '#F59E0B', vibrant_neon: '#7C3AED', warm_bistro: '#7C2D12', minimal_stand: '#111827', google_deluxe: '#1E293B' };
const DESTINATIONS = { landing: 'Shop landing page', menu: 'Digital menu', review: 'Feedback page', url: 'Your website' };
const HEADLINES = { landing: 'Scan to explore our shop', menu: 'Scan to view our menu', review: 'Scan to share your feedback', url: 'Scan to visit us online' };

export default function QrNfcGenerator({ businessProfile, savedProfile, dirty, onNavigate }) {
  const destination = savedProfile?.qrDestination || businessProfile.qrDestination || 'landing';
  const [selectedTheme, setSelectedTheme] = useState('google_deluxe');
  const [posterFormat, setPosterFormat] = useState('tabletop'); // tabletop | tent | sticker | poster
  const [posterTitle, setPosterTitle] = useState(HEADLINES[destination]);
  const [posterSubtitle, setPosterSubtitle] = useState('Our menu, shop details and feedback — all in one place.');
  const [centerLogoType, setCenterLogoType] = useState('none'); // google | business | nfc | none
  const [logoShape, setLogoShape] = useState('squircle'); // squircle | banner | circle
  const [logoSize, setLogoSize] = useState('large'); // normal | large | extra_large
  const [customQrColor, setCustomQrColor] = useState('');
  const [exportError, setExportError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [artifact, setArtifact] = useState(null);
  const [copied, setCopied] = useState(false);
  const posterRef = useRef(null);
  useEffect(() => () => { if (artifact) URL.revokeObjectURL(artifact.url); }, [artifact]);
  const deliver = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    setArtifact({ url, filename });
    const link = document.createElement('a'); link.href = url; link.download = filename;
    document.body.appendChild(link); link.click(); link.remove();
  };

  // Posters always carry the shop's dynamic link, so a printed code follows the destination saved on the QR codes page.
  const targetUrl = new URL(`/q/${businessProfile.id}`, window.location.origin).href;
  const copyLink = async () => { try { await navigator.clipboard.writeText(targetUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); } };
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
  const targetError = !savedProfile?.published ? 'Publish this shop before printing its QR code. Use the switch in the top bar, then save.'
    : dirty ? 'Save your changes before printing, so the poster matches your live shop.' : '';

  let centerLogoSrc = null;
  if (centerLogoType === 'google') centerLogoSrc = GOOGLE_G_LOGO;
  else if (centerLogoType === 'business' && businessProfile.logo) centerLogoSrc = businessProfile.logo;
  else if (centerLogoType === 'nfc') centerLogoSrc = NFC_ICON_DATA;
  const getThemeQrFg = () => customQrColor || QR_COLOURS[selectedTheme] || QR_COLOURS.google_deluxe;

  const downloadQrCodeSVG = async () => {
    setExportError(''); setExporting(true);
    try {
      const svg = posterRef.current?.querySelector('[data-qr-code="true"]');
      if (!svg) return;
      const clone = await standaloneClone(svg);
      deliver(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }), `${businessProfile.id}-qr.svg`);
    } catch (e) { setExportError(e.message); } finally { setExporting(false); }
  };
  const downloadPosterPNG = async () => {
    setExportError(''); setExporting(true);
    try { deliver(await exportPoster(posterRef.current), `${businessProfile.id}-poster-${selectedTheme}.png`); }
    catch (e) { setExportError(e.message); } finally { setExporting(false); }
  };
  const select = (id, label, value, onChange, options) => <div className="form-group"><label className="form-label" htmlFor={id}>{label}</label><select id={id} className="form-input" value={value} onChange={e => onChange(e.target.value)}>{options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}</select></div>;

  return (
    <div className="sp-page print-page">
      <header className="page-header no-print">
        <div><h1>Print & NFC</h1><p>Design table stands, tent cards, stickers and posters with your QR code, then print or download them.</p></div>
      </header>
      <div className="print-layout">
        <div className="sp-stack no-print">
          <section className="card">
            <div className="card-head"><div><h2>Where scans go</h2><p>Every poster uses your shop’s dynamic QR code. Change the destination any time on the QR codes page; printed codes follow it.</p></div></div>
            <div className="print-destination">
              <div><span className="print-destination-label">Opens</span><strong>{DESTINATIONS[destination]}</strong><a className="print-destination-url" href={targetUrl} target="_blank" rel="noopener noreferrer">{targetUrl}</a></div>
              <div className="print-destination-actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={copyLink}>{copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}{copied ? 'Link copied' : 'Copy link'}</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate?.('qr')}>Change destination<ArrowRight size={14} aria-hidden="true" /></button>
              </div>
              <span className="sr-only" role="status">{copied ? 'Link copied to the clipboard' : ''}</span>
            </div>
            {local && <p className="notice warning">You’re using a local address. Open the studio on your live website before printing, or customers’ phones can’t reach this link.</p>}
            {targetError && <p role="alert" className="notice error">{targetError}</p>}
          </section>
          <section className="card">
            <div className="card-head"><div><h2>Style</h2><p>Pick a look and size for your stand or poster.</p></div></div>
            <div className="poster-theme-selector-grid" role="group" aria-label="Poster style">
              {THEMES.map(theme => <button key={theme.id} type="button" aria-pressed={selectedTheme === theme.id} className={`poster-theme-btn ${selectedTheme === theme.id ? 'active' : ''}`} onClick={() => setSelectedTheme(theme.id)}>
                <span className={`theme-preview-swatch ${theme.swatch}`} aria-hidden="true">{theme.mark}</span>
                <span className="theme-btn-info"><span className="theme-name">{theme.name}</span><span className="theme-desc">{theme.description}</span></span>
                {selectedTheme === theme.id && <Check size={16} className="theme-check" aria-hidden="true" />}
              </button>)}
            </div>
            <div className="form-grid print-options">
              {select('poster-format', 'Format', posterFormat, setPosterFormat, [['tabletop', 'Table stand · 5×7 in'], ['tent', 'Tent card · A5, folds in half'], ['sticker', 'Sticker · 3×3 in'], ['poster', 'Wall poster · A4']])}
              {select('poster-centre', 'Centre of the QR', centerLogoType, setCenterLogoType, [['none', 'Nothing'], ...(businessProfile.logo ? [['business', 'Your logo']] : []), ['google', 'Google “G”'], ['nfc', 'NFC icon']])}
              {businessProfile.logo && select('poster-logo-shape', 'Logo shape', logoShape, setLogoShape, [['squircle', 'Rounded square'], ['circle', 'Circle'], ['banner', 'Wide banner']])}
              {businessProfile.logo && select('poster-logo-size', 'Logo size', logoSize, setLogoSize, [['normal', 'Standard'], ['large', 'Large'], ['extra_large', 'Extra large']])}
            </div>
          </section>
          <section className="card">
            <div className="card-head"><div><h2>Text and colour</h2></div></div>
            <div className="form-grid">
              <div className="form-group"><label className="form-label" htmlFor="poster-title">Headline</label><input id="poster-title" className="form-input" maxLength={60} value={posterTitle} onChange={e => setPosterTitle(e.target.value)} /></div>
              <div className="form-group"><label className="form-label" htmlFor="poster-subtitle">Subtitle</label><input id="poster-subtitle" className="form-input" maxLength={90} value={posterSubtitle} onChange={e => setPosterSubtitle(e.target.value)} /></div>
            </div>
            <div className="form-group"><label className="form-label" htmlFor="poster-qr-colour">QR code colour</label>
              <div className="inline-form"><input id="poster-qr-colour" type="color" className="form-input" value={getThemeQrFg()} onChange={e => setCustomQrColor(e.target.value)} />{customQrColor && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCustomQrColor('')}>Use style colour</button>}</div>
              <p className="field-help">Keep it dark on a light background so every phone can scan it.</p>
            </div>
          </section>
          <section className="card">
            <div className="page-actions">
              <button type="button" className="btn btn-primary" onClick={downloadPosterPNG} disabled={!!targetError || exporting}><Download size={16} aria-hidden="true" />{exporting ? 'Preparing…' : 'Download poster (PNG)'}</button>
              <button type="button" className="btn btn-secondary" onClick={downloadQrCodeSVG} disabled={!!targetError || exporting}><Download size={16} aria-hidden="true" />Download QR (SVG)</button>
              <button type="button" className="btn btn-secondary" onClick={() => window.print()} disabled={!!targetError || exporting}><Printer size={16} aria-hidden="true" />Print</button>
            </div>
            {exportError && <p role="alert" className="notice error">{exportError}</p>}
            {artifact && <div className="export-result"><a href={artifact.url} download={artifact.filename}>Download ready: {artifact.filename}</a><img src={artifact.url} alt="Exported image preview" /></div>}
            <p className="field-help">NFC: program a tag with the link above using any NFC-writing app.</p>
          </section>
        </div>

        <div className="poster-preview-stage" aria-label="Print preview">
          <div className="poster-preview-stage-header no-print"><span>Preview · {{ tabletop: 'Table stand', tent: 'Tent card', sticker: 'Sticker', poster: 'Wall poster' }[posterFormat]}</span></div>

        {/* Poster Main Render Container */}
        {posterFormat === 'tent' ? (
          // A tent card has to show right-side-up on BOTH faces once folded,
          // from a single-sided sheet. Standard trick: print the same face
          // twice on one sheet with the top copy rotated 180°, then fold
          // along the middle — both faces read correctly once it's standing.
          <div ref={posterRef} className="tent-sheet-wrapper">
            <div
              className={`poster-preview-card poster-theme-${selectedTheme} tent-panel tent-panel-upside-down`}
              style={{ borderColor: businessProfile.accentColor && selectedTheme === 'google_deluxe' ? businessProfile.accentColor : undefined }}
            >
              {renderCardFace('back', { compact: true })}
            </div>

            <div className="tent-fold-line no-print">
              <span>✂ FOLD HERE — top panel prints upside-down so both faces read right-side-up once folded</span>
            </div>

            <div
              className={`poster-preview-card poster-theme-${selectedTheme} tent-panel`}
              style={{ borderColor: businessProfile.accentColor && selectedTheme === 'google_deluxe' ? businessProfile.accentColor : undefined }}
            >
              {renderCardFace('front', { compact: true })}
            </div>
          </div>
        ) : (
          <div
            ref={posterRef}
            className={`poster-preview-card poster-theme-${selectedTheme} poster-format-${posterFormat}`}
            style={{
              borderColor: businessProfile.accentColor && selectedTheme === 'google_deluxe' ? businessProfile.accentColor : undefined
            }}
          >
            {renderCardFace('single')}
          </div>
        )}
      </div>
      </div>
    </div>
  );

  // Shared card-face content, reused as-is for tabletop/sticker/poster.
  // Tent faces use compact content so both panels fit on one sheet.
  function renderCardFace(instanceKey, { compact = false } = {}) {
    return (
      <>
        {/* Decorative Top Bar for Google Deluxe */}
        {selectedTheme === 'google_deluxe' && (
          <div className="google-top-color-strip">
            <span style={{ background: '#4285F4' }} />
            <span style={{ background: '#EA4335' }} />
            <span style={{ background: '#FBBC05' }} />
            <span style={{ background: '#34A853' }} />
          </div>
        )}

        {/* Decorative Gold Header Bar for Dark Luxe */}
        {selectedTheme === 'dark_luxe' && (
          <div className="dark-luxe-accent-glow" />
        )}

        {/* Business Logo & Name */}
        <div className="poster-header-block">
          {businessProfile.logo && (
            <div className={`poster-logo-wrapper shape-${logoShape} size-${logoSize}`}>
              <img
                src={businessProfile.logo}
                alt={businessProfile.name}
                className="poster-business-logo"
              />
            </div>
          )}

          <h2 className="poster-business-name">
            {businessProfile.name}
          </h2>

          {businessProfile.tagline && !compact && (
            <p className="poster-business-tagline">
              {businessProfile.tagline}
            </p>
          )}
        </div>

        {/* Main Headline & Subtitle */}
        <div className="poster-cta-text-block">
          <h3 className="poster-main-title">
            {posterTitle}
          </h3>
          {!compact && (
            <p className="poster-subtitle">
              {posterSubtitle}
            </p>
          )}
        </div>

        {/* High-Res QR Code Frame */}
        <div className="poster-qr-frame">
          <QRCodeSVG
            data-qr-code="true"
            value={targetUrl || 'Not published'}
            size={posterFormat === 'sticker' ? 150 : posterFormat === 'poster' ? 220 : compact ? 108 : 190}
            level="H"
            includeMargin={true}
            fgColor={getThemeQrFg()}
            bgColor={selectedTheme === 'dark_luxe' ? '#0F172A' : '#FFFFFF'}
            imageSettings={centerLogoSrc ? {
              src: centerLogoSrc,
              height: posterFormat === 'sticker' ? 30 : 38,
              width: posterFormat === 'sticker' ? 30 : 38,
              excavate: true
            } : undefined}
          />

          {/* Direct Link Micro-Badge */}
          <div className="poster-direct-link-badge">
            <ExternalLink size={12} color="#4285F4" />
            <span>{DESTINATIONS[destination]}</span>
          </div>
        </div>

        {/* NFC Tap Sensor Callout Row */}
        <div className="nfc-tap-icon-row">
          <div className="nfc-pulse-ring">
            <Radio size={18} className="nfc-radio-icon" />
          </div>
          <div className="nfc-text-wrapper">
            <span className="nfc-bold-label">SCAN QR OR TAP YOUR NFC TAG</span>
            <span className="nfc-sub-label">Program your NFC tag with the link above</span>
          </div>
          <Smartphone size={18} className="nfc-phone-icon" />
        </div>
      </>
    );
  }
}

