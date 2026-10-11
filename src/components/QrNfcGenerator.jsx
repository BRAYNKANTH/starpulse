import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Printer, Download, Radio, Star, ExternalLink, Smartphone, 
  Sparkles, Layers, Image as ImageIcon, Check, Palette, Eye
} from 'lucide-react';

import { shopUrl } from '../data/api';
import { standaloneClone, exportPoster } from '../utils/export';

const GOOGLE_G_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%234285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="%2334A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="%23FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/><path fill="%23EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>`;

const NFC_ICON_DATA = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%232563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18a10 10 0 0 1 0-12"/><path d="M10 15a6 6 0 0 1 0-6"/><path d="M14 12a2 2 0 0 1 0 0"/><circle cx="12" cy="12" r="1" fill="%232563EB"/></svg>`;

export default function QrNfcGenerator({ businessProfile, savedProfile, dirty }) {
  const [selectedTheme, setSelectedTheme] = useState('google_deluxe'); 
  // 'google_deluxe' | 'dark_luxe' | 'minimal_stand' | 'vibrant_neon' | 'warm_bistro'
  
  const [posterFormat, setPosterFormat] = useState('tabletop'); 
  // 'tabletop' | 'tent' | 'sticker' | 'poster'
  
  const [posterTitle, setPosterTitle] = useState('Scan to explore our shop');
  const [destination, setDestination] = useState('landing');
  const [publicBase, setPublicBase] = useState(window.location.origin);
  const [exportError, setExportError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [artifact, setArtifact] = useState(null);
  useEffect(() => () => { if (artifact) URL.revokeObjectURL(artifact.url); }, [artifact]);
  const deliver = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    setArtifact({ url, filename });
    const link = document.createElement('a'); link.href = url; link.download = filename;
    document.body.appendChild(link); link.click(); link.remove();
  };
  const [posterSubtitle, setPosterSubtitle] = useState('Our menu, shop details and feedback — all in one place.');
  const [centerLogoType, setCenterLogoType] = useState('none'); // 'google' | 'business' | 'nfc' | 'none'
  const [logoShape, setLogoShape] = useState('squircle'); // 'squircle' | 'banner' | 'circle'
  const [logoSize, setLogoSize] = useState('large'); // 'large' | 'extra_large' | 'normal'
  const [customQrColor, setCustomQrColor] = useState('');

  const posterRef = useRef(null);

  // Shop links resolve published server data; Google links open directly.
  let targetUrl = '';
  let targetError = '';
  try {
    if (destination === 'google') {
      if (!businessProfile.googleReviewUrl) throw new Error('Add your Google review URL in Business Register first.');
      targetUrl = businessProfile.googleReviewUrl;
      if (!['https:', 'http:'].includes(new URL(targetUrl).protocol)) throw new Error('Enter a valid Google review URL.');
    } else {
      if (!savedProfile?.published) throw new Error('Save and publish this shop in Menu Builder before generating its QR code.');
      if (dirty) throw new Error('Save your changes before generating the customer QR code.');
      if (!['https:', 'http:'].includes(new URL(publicBase).protocol)) throw new Error('Enter a valid public website address.');
      targetUrl = shopUrl(businessProfile.id, destination, publicBase);
    }
  } catch (e) { targetError = e.message; }
  const titleForDestination = { landing: 'Scan to explore our shop', menu: 'Scan to view our menu', google: 'Scan to leave a Google review' };

  // Center logo resolution for QRCodeSVG
  let centerLogoSrc = null;
  if (centerLogoType === 'google') {
    centerLogoSrc = GOOGLE_G_LOGO;
  } else if (centerLogoType === 'business' && businessProfile.logo) {
    centerLogoSrc = businessProfile.logo;
  } else if (centerLogoType === 'nfc') {
    centerLogoSrc = NFC_ICON_DATA;
  }

  // Theme color resolve for QR code foreground
  const getThemeQrFg = () => {
    if (customQrColor) return customQrColor;
    switch (selectedTheme) {
      case 'dark_luxe': return '#F59E0B';
      case 'vibrant_neon': return '#7C3AED';
      case 'warm_bistro': return '#7C2D12';
      case 'minimal_stand': return '#111827';
      case 'google_deluxe':
      default: return '#1E293B';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadQrCodeSVG = async () => {
    setExportError(''); setExporting(true);
    try {
      const svg = posterRef.current?.querySelector('[data-qr-code="true"]');
      if (!svg) return;
      const clone = await standaloneClone(svg);
      deliver(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }), businessProfile.id + '-' + destination + '-qr.svg');
    } catch (e) { setExportError(e.message); } finally { setExporting(false); }
  };
  const downloadPosterPNG = async () => {
    setExportError(''); setExporting(true);
    try { deliver(await exportPoster(posterRef.current), businessProfile.id + '-poster-' + selectedTheme + '.png'); }
    catch (e) { setExportError(e.message); } finally { setExporting(false); }
  };

  return (
    <div className="qr-studio-wrapper">
      <header className="page-header no-print">
        <div><h1>Print & NFC</h1><p>Design table stands, tent cards, stickers and posters with your QR code, then print or download them.</p></div>
      </header>
      {/* Control Settings Panel */}
      <div className="admin-card no-print" style={{ margin: '1.25rem 0 2rem' }}>
        {/* Destination */}
        <div className="qr-destination-settings">
          <label className="form-label" htmlFor="qr-destination">Where should a scan open?</label>
          <select id="qr-destination" className="form-input" value={destination} onChange={e => { setDestination(e.target.value); setPosterTitle(titleForDestination[e.target.value]); setPosterSubtitle(e.target.value === 'google' ? 'Share your honest experience. Every rating is welcome.' : 'Our menu, shop details and feedback — all in one place.'); }}>
            <option value="landing">Shop landing page</option><option value="menu">Shop menu</option><option value="google">Direct Google review</option>
          </select>
          {destination !== 'google' && <><label className="form-label" htmlFor="public-base">Public website address</label><input id="public-base" className="form-input" type="url" value={publicBase} onChange={e => setPublicBase(e.target.value)} /><p className="field-help">Use the deployed website address for customer scans. A localhost address only works on this computer.</p></>}
          {targetError ? <p role="alert" className="notice error">{targetError}</p> : <a className="public-link" href={targetUrl} target="_blank" rel="noopener noreferrer">{targetUrl}</a>}
          {exportError && <p role="alert" className="notice error">{exportError}</p>}
          {artifact && <div className="export-result"><a className="public-link" href={artifact.url} download={artifact.filename}>Download ready: {artifact.filename}</a><img src={artifact.url} alt="Exported image preview" style={{ maxWidth: '220px', maxHeight: '280px', display: 'block', borderRadius: '8px' }} /></div>}
        </div>
        {/* 1. Theme Selector Grid */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Palette size={14} color="var(--primary-accent)" />
            <span>Select Poster Aesthetic Theme</span>
          </div>
          <div className="poster-theme-selector-grid">
            
            {/* Theme 1: Google Deluxe */}
            <button
              type="button"
              className={`poster-theme-btn ${selectedTheme === 'google_deluxe' ? 'active' : ''}`}
              onClick={() => setSelectedTheme('google_deluxe')}
            >
              <div className="theme-preview-swatch google-swatch">
                <span style={{ color: '#4285F4' }}>G</span>
                <span style={{ color: '#EA4335' }}>o</span>
                <span style={{ color: '#FBBC05' }}>o</span>
                <span style={{ color: '#34A853' }}>g</span>
              </div>
              <div className="theme-btn-info">
                <span className="theme-name">Google Deluxe</span>
                <span className="theme-desc">Official 4-color signature look</span>
              </div>
              {selectedTheme === 'google_deluxe' && <Check size={16} className="theme-check" />}
            </button>

            {/* Theme 2: Dark Luxe Gold */}
            <button
              type="button"
              className={`poster-theme-btn ${selectedTheme === 'dark_luxe' ? 'active' : ''}`}
              onClick={() => setSelectedTheme('dark_luxe')}
            >
              <div className="theme-preview-swatch dark-swatch">
                <Star size={12} fill="#F59E0B" color="#F59E0B" />
              </div>
              <div className="theme-btn-info">
                <span className="theme-name">Obsidian & Gold</span>
                <span className="theme-desc">Ultra-luxury dark VIP aesthetic</span>
              </div>
              {selectedTheme === 'dark_luxe' && <Check size={16} className="theme-check" />}
            </button>

            {/* Theme 3: Minimalist Stand */}
            <button
              type="button"
              className={`poster-theme-btn ${selectedTheme === 'minimal_stand' ? 'active' : ''}`}
              onClick={() => setSelectedTheme('minimal_stand')}
            >
              <div className="theme-preview-swatch minimal-swatch">
                <span>Aa</span>
              </div>
              <div className="theme-btn-info">
                <span className="theme-name">Minimalist Stand</span>
                <span className="theme-desc">Clean high-contrast monochrome</span>
              </div>
              {selectedTheme === 'minimal_stand' && <Check size={16} className="theme-check" />}
            </button>

            {/* Theme 4: Vibrant Neon */}
            <button
              type="button"
              className={`poster-theme-btn ${selectedTheme === 'vibrant_neon' ? 'active' : ''}`}
              onClick={() => setSelectedTheme('vibrant_neon')}
            >
              <div className="theme-preview-swatch neon-swatch">
                <Sparkles size={12} color="#EC4899" />
              </div>
              <div className="theme-btn-info">
                <span className="theme-name">Vibrant Neon</span>
                <span className="theme-desc">Electric gradient & glow ring</span>
              </div>
              {selectedTheme === 'vibrant_neon' && <Check size={16} className="theme-check" />}
            </button>

            {/* Theme 5: Warm Bistro */}
            <button
              type="button"
              className={`poster-theme-btn ${selectedTheme === 'warm_bistro' ? 'active' : ''}`}
              onClick={() => setSelectedTheme('warm_bistro')}
            >
              <div className="theme-preview-swatch bistro-swatch">
                <span>☕</span>
              </div>
              <div className="theme-btn-info">
                <span className="theme-name">Warm Bistro & Spa</span>
                <span className="theme-desc">Elegant cream & rich burgundy</span>
              </div>
              {selectedTheme === 'warm_bistro' && <Check size={16} className="theme-check" />}
            </button>

          </div>
        </div>

        {/* 2. Format & Layout Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label className="form-label" htmlFor="poster-control-1" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={14} color="var(--primary-accent)" />
              <span>Poster Format / Size</span>
            </label>
            <select id="poster-control-1"
              className="form-input"
              value={posterFormat}
              onChange={(e) => setPosterFormat(e.target.value)}
            >
              <option value="tabletop">Countertop Table Stand (5" x 7" Portrait)</option>
              <option value="tent">Desk Tent Fold (A5 Landscape Double-Sided)</option>
              <option value="sticker">Compact Sticker Badge (3" x 3" Square)</option>
              <option value="poster">Reception Wall Poster (A4 / Letter)</option>
            </select>
          </div>

          <div>
            <label className="form-label" htmlFor="poster-control-2" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ImageIcon size={14} color="var(--primary-accent)" />
              <span>Poster Business Logo Style</span>
            </label>
            <select id="poster-control-2"
              className="form-input"
              value={logoShape}
              onChange={(e) => setLogoShape(e.target.value)}
            >
              <option value="squircle">Edged Square (Modern Squircle)</option>
              <option value="banner">Transparent Header Banner (Wide)</option>
              <option value="circle">Classic Circle Badge</option>
            </select>
          </div>

          <div>
            <label className="form-label" htmlFor="poster-control-3">Logo Display Size</label>
            <select id="poster-control-3"
              className="form-input"
              value={logoSize}
              onChange={(e) => setLogoSize(e.target.value)}
            >
              <option value="extra_large">Extra Large (High Impact - 110px+)</option>
              <option value="large">Large (90px)</option>
              <option value="normal">Standard (70px)</option>
            </select>
          </div>

          <div>
            <label className="form-label" htmlFor="poster-control-4" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ImageIcon size={14} color="var(--primary-accent)" />
              <span>QR Center Logo Overlay</span>
            </label>
            <select id="poster-control-4"
              className="form-input"
              value={centerLogoType}
              onChange={(e) => setCenterLogoType(e.target.value)}
            >
              <option value="google">Official Google "G" Badge</option>
              {businessProfile.logo && <option value="business">Your Business Logo</option>}
              <option value="nfc">NFC Touch Icon</option>
              <option value="none">No Center Logo (Standard QR)</option>
            </select>
          </div>
        </div>

        {/* 3. Text Customizations */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label className="form-label" htmlFor="poster-control-5">Main Headline</label>
            <input id="poster-control-5"
              type="text"
              className="form-input"
              value={posterTitle}
              onChange={(e) => setPosterTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" htmlFor="poster-control-6">Subtitle Message</label>
            <input id="poster-control-6"
              type="text"
              className="form-input"
              value={posterSubtitle}
              onChange={(e) => setPosterSubtitle(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" htmlFor="poster-control-7">Custom QR Foreground Color (Optional)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input id="poster-control-7"
                type="color"
                className="form-input"
                style={{ width: '48px', padding: '0.2rem', cursor: 'pointer' }}
                value={customQrColor || getThemeQrFg()}
                onChange={(e) => setCustomQrColor(e.target.value)}
              />
              {customQrColor && (
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => setCustomQrColor('')}
                >
                  Reset Theme Default
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 5. Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="carrd-submit-btn"
            style={{ width: 'auto', padding: '0.75rem 1.25rem' }}
            onClick={downloadQrCodeSVG}
            disabled={!!targetError || exporting}
          >
            <Download size={16} />
            <span>Download Vector QR (SVG)</span>
          </button>

          <button
            type="button"
            className="carrd-submit-btn"
            style={{ width: 'auto', padding: '0.75rem 1.25rem', background: '#10B981', color: '#FFF' }}
            onClick={downloadPosterPNG}
            disabled={!!targetError || exporting}
          >
            <Download size={16} />
            <span>Download Full Poster (PNG Image)</span>
          </button>

          <button
            type="button"
            className="carrd-submit-btn"
            style={{ width: 'auto', padding: '0.75rem 1.25rem', background: '#3B82F6', color: '#FFF' }}
            onClick={handlePrint}
            disabled={!!targetError || exporting}
          >
            <Printer size={16} />
            <span>Print Reception Poster</span>
          </button>
        </div>
      </div>

      {/* Live Poster Display Card Canvas */}
      <div className="poster-preview-stage" style={targetError ? { display: 'none' } : undefined}>
        <div className="poster-preview-stage-header no-print">
          <Eye size={16} color="var(--primary-accent)" />
          <span>Live Countertop Print Preview ({posterFormat.toUpperCase()})</span>
        </div>

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
            <span>{destination === 'google' ? 'Google review' : destination === 'menu' ? 'Shop menu' : 'Shop landing page'}</span>
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

