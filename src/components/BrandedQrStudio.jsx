import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowUpRight, Check, Download, Globe, Link2, Palette, QrCode, Smartphone, Wifi } from 'lucide-react';
import { normalizeQrDesign, QR_PRESETS, qrPayload, contrastRatio } from '../data/qrDesign';
import { api } from '../data/api';
import { exportPoster, standaloneClone } from '../utils/export';

const TYPES = [{ id: 'dynamic', name: 'Shop / dynamic', icon: QrCode }, { id: 'url', name: 'Website', icon: Globe }, { id: 'whatsapp', name: 'WhatsApp', icon: Smartphone }, { id: 'wifi', name: 'Wi-Fi', icon: Wifi }];

export default function BrandedQrStudio({ businessProfile: profile, setBusinessProfile, savedProfile, dirty, onSave, saving }) {
  const [type, setType] = useState('dynamic');
  const [base, setBase] = useState(window.location.origin);
  const [fields, setFields] = useState({ url: '', phone: profile.phone || '', message: '', ssid: '', password: '', security: 'WPA', hidden: false });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [artifact, setArtifact] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const preview = useRef(null);
  const design = normalizeQrDesign(profile.qrDesign);
  const destination = profile.qrDestination || 'landing';
  const change = patch => { setArtifact(null); setBusinessProfile({ ...profile, ...patch }); };
  const style = patch => change({ qrDesign: { ...design, ...patch } });
  const field = (name, value) => { setArtifact(null); setFields(current => ({ ...current, [name]: value })); };
  useEffect(() => {
    let active = true;
    api(`/admin/businesses/${profile.id}/analytics`).then(data => { if (active) setAnalytics(data); }).catch(() => {});
    return () => { active = false; };
  }, [profile.id]);
  useEffect(() => () => { if (artifact) URL.revokeObjectURL(artifact.url); }, [artifact]);
  let payload = '', validation = '';
  try {
    if (type === 'dynamic') {
      const address = new URL(base);
      if (!['http:', 'https:'].includes(address.protocol)) throw new Error('Use an http or https public website address.');
      payload = new URL(`/q/${profile.id}`, address.origin).href;
      if (!savedProfile?.published || dirty) validation = 'Save and publish this shop before downloading its dynamic QR.';
      else if (destination === 'url') qrPayload('url', { url: profile.qrUrl });
    } else payload = qrPayload(type, fields);
  } catch (e) { validation = e.message; }
  const contrast = contrastRatio(design.foreground, design.background);
  const lightBackground = parseInt(design.background.slice(1, 3), 16) + parseInt(design.background.slice(3, 5), 16) + parseInt(design.background.slice(5), 16) > parseInt(design.foreground.slice(1, 3), 16) + parseInt(design.foreground.slice(3, 5), 16) + parseInt(design.foreground.slice(5), 16);
  const contrastError = contrast < 4.5 || !lightBackground ? 'Choose dark QR dots on a light background with stronger contrast.' : '';
  const exportFile = async format => {
    setBusy(true); setError('');
    try {
      let blob;
      if (format === 'png') blob = await exportPoster(preview.current);
      else {
        const code = await standaloneClone(preview.current.querySelector('svg'));
        const framed = design.frame !== 'none', labelled = design.frame === 'label';
        const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        wrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        wrapper.setAttribute('width', '336'); wrapper.setAttribute('height', labelled ? '394' : '336'); wrapper.setAttribute('viewBox', labelled ? '0 0 336 394' : '0 0 336 336');
        const rect = document.createElementNS(wrapper.namespaceURI, 'rect');
        rect.setAttribute('width', '336'); rect.setAttribute('height', labelled ? '394' : '336'); rect.setAttribute('rx', design.rounded ? '20' : '0'); rect.setAttribute('fill', framed ? design.frameColor : design.background); wrapper.appendChild(rect);
        code.setAttribute('x', '18'); code.setAttribute('y', '18'); code.setAttribute('width', '300'); code.setAttribute('height', '300'); code.style.width = '300px'; code.style.height = '300px'; wrapper.appendChild(code);
        if (labelled) {
          const text = document.createElementNS(wrapper.namespaceURI, 'text'); text.setAttribute('x', '168'); text.setAttribute('y', '360'); text.setAttribute('text-anchor', 'middle'); text.setAttribute('fill', contrastRatio('#ffffff', design.frameColor) >= 4.5 ? '#ffffff' : '#172033'); text.setAttribute('font-family', 'Arial, sans-serif'); text.setAttribute('font-size', String(Math.min(14, 280 / Math.max(1, design.label.length * .65)))); text.setAttribute('font-weight', '700'); text.textContent = design.label; wrapper.appendChild(text);
        }
        blob = new Blob([new XMLSerializer().serializeToString(wrapper)], { type: 'image/svg+xml' });
      }
      setArtifact({ url: URL.createObjectURL(blob), filename: `${profile.id}-branded-qr.${format}` });
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const input = (label, key, inputType = 'text') => <label className="bqr-field">{label}<input className="form-input" type={inputType} value={fields[key]} onChange={e => field(key, e.target.value)} /></label>;
  return <div className="branded-workspace">
    <header className="page-header"><div><h1>QR codes</h1><p>Create a branded code for your shop, a website, WhatsApp or Wi-Fi.</p></div></header>
    <div className="bqr-columns">
      <section className="bqr-editor">
        <div className="bqr-step"><span>01</span><div><h2>Where should it go?</h2><p>Choose what your customers discover.</p></div></div>
        <div className="bqr-types" role="group" aria-label="QR code type">{TYPES.map(({ id, name, icon: Icon }) => <button type="button" key={id} aria-pressed={type === id} className={type === id ? 'selected' : ''} onClick={() => { setType(id); setArtifact(null); setError(''); }}><Icon size={20} />{name}</button>)}</div>
        {type === 'dynamic' ? <div className="bqr-fields"><label className="bqr-field">Destination<select className="form-input" value={destination} onChange={e => change({ qrDestination: e.target.value })}><option value="landing">Shop landing page</option><option value="menu">Digital menu</option><option value="review">Feedback page</option><option value="url">Custom website</option></select></label>{destination === 'url' && <label className="bqr-field">Destination website<input className="form-input" type="url" value={profile.qrUrl || ''} onChange={e => change({ qrUrl: e.target.value })} /></label>}<label className="bqr-field">Public website address<input className="form-input" type="url" value={base} onChange={e => { setArtifact(null); setBase(e.target.value); }} /></label><div className="bqr-tip"><Link2 size={18} /><div><strong>Print once. Update anytime.</strong><p>Change this destination and save your shop. The same QR will open the latest saved destination.</p></div></div>{/localhost|127\.0\.0\.1/.test(base) && <p className="bqr-help">This local address works only on this computer. Enter your deployed domain for customer scans.</p>}</div> : <div className="bqr-fields">{type === 'url' && input('Website address', 'url', 'url')}{type === 'whatsapp' && <>{input('Phone number including country code', 'phone', 'tel')}{input('Pre-filled message', 'message')}</>}{type === 'wifi' && <>{input('Network name', 'ssid')}{input('Password', 'password', 'password')}<label className="bqr-field">Security<select className="form-input" value={fields.security} onChange={e => field('security', e.target.value)}><option value="WPA">WPA / WPA2 / WPA3</option><option value="WEP">WEP</option><option value="nopass">Open network</option></select></label><label className="bqr-toggle"><input type="checkbox" checked={fields.hidden} onChange={e => field('hidden', e.target.checked)} />Hidden network</label></>}<p className="bqr-help">Static QR: this information is encoded directly. Changing it requires a new QR.</p></div>}
        <div className="bqr-divider" /><div className="bqr-step"><span>02</span><div><h2>Give it your signature</h2><p>Start with a style, then make it yours.</p></div></div>
        <div className="bqr-presets" role="group" aria-label="Design presets">{QR_PRESETS.map(preset => <button type="button" key={preset.id} onClick={() => style(preset)}><span style={{ background: preset.frameColor }}><QrCode size={27} /></span>{preset.name}</button>)}</div>
        <div className="bqr-colors">{[['foreground', 'QR dots'], ['background', 'Background'], ['frameColor', 'Frame']].map(([key, label]) => <label className="bqr-field" key={key}>{label}<div className="bqr-color"><input type="color" aria-label={label} value={design[key]} onChange={e => style({ [key]: e.target.value })} /><span>{design[key].toUpperCase()}</span></div></label>)}</div>
        <div className="bqr-fields bqr-two"><label className="bqr-field">Frame style<select className="form-input" value={design.frame} onChange={e => style({ frame: e.target.value })}><option value="none">Clean / no frame</option><option value="border">Border frame</option><option value="label">Frame with caption</option></select></label><label className="bqr-field">Frame caption<input className="form-input" maxLength={60} value={design.label} onChange={e => style({ label: e.target.value })} /></label></div>
        <label className="bqr-toggle"><input type="checkbox" checked={design.rounded} onChange={e => style({ rounded: e.target.checked })} />Rounded frame corners</label><label className="bqr-toggle"><input type="checkbox" checked={design.showLogo} disabled={!profile.logo} onChange={e => style({ showLogo: e.target.checked })} />Use my business logo in the QR{!profile.logo && <small>Add a logo in Business Studio.</small>}</label>
        <button type="button" className="bqr-save" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save design & destination'}<Check size={16} /></button><p className="bqr-help">Design settings are saved with this shop. Wi-Fi passwords and static input fields are kept only in this open editor.</p>
      </section>
      <aside className="bqr-preview-panel"><div className="bqr-preview-title"><span><Palette size={17} />Your QR, live</span><span>High resolution</span></div><div className="bqr-preview-stage"><div ref={preview} className={`bqr-art bqr-frame-${design.frame}`} style={{ background: design.frame === 'none' ? design.background : design.frameColor, borderRadius: design.rounded ? 20 : 0 }}><QRCodeSVG value={payload || 'https://example.com'} size={300} level="H" marginSize={4} fgColor={design.foreground} bgColor={design.background} imageSettings={design.showLogo && profile.logo ? { src: profile.logo, height: 42, width: 42, excavate: true } : undefined} /><span className="bqr-caption" style={{ color: contrastRatio('#ffffff', design.frameColor) >= 4.5 ? '#ffffff' : '#172033' }}>{design.label}</span></div></div><div className="bqr-preview-bottom"><span className="bqr-valid"><Check size={15} />High error correction · quiet zone preserved</span><p className="bqr-help">Test a scan on your phone before printing.</p>{validation && <p role="alert" className="bqr-warning">{validation}</p>}{contrastError && <p role="alert" className="bqr-warning">{contrastError}</p>}{error && <p role="alert" className="bqr-warning">{error}</p>}<div className="bqr-downloads"><button type="button" disabled={!!validation || !!contrastError || busy} onClick={() => exportFile('png')}><Download size={17} />{busy ? 'Preparing…' : 'Download PNG'}</button><button type="button" disabled={!!validation || !!contrastError || busy} onClick={() => exportFile('svg')}>Download SVG</button></div>{artifact && <div className="bqr-artifact"><a href={artifact.url} download={artifact.filename}>Download ready: {artifact.filename}</a><img src={artifact.url} alt="Downloaded branded QR preview" /></div>}{payload && type !== 'wifi' && <a className="bqr-destination-link" href={payload} target="_blank" rel="noopener noreferrer">{payload}<ArrowUpRight size={16} /></a>}<div className="bqr-stats"><div><strong>{analytics?.count ?? '—'}</strong><span>Dynamic link visits</span></div><div><strong>{analytics?.lastVisited ? new Date(analytics.lastVisited).toLocaleDateString() : '—'}</strong><span>Last visit</span></div></div><p className="bqr-help">Visits count requests to this shop’s dynamic link, including test visits. They do not identify unique people.</p><button className="bqr-refresh" type="button" onClick={async () => { try { setAnalytics(await api(`/admin/businesses/${profile.id}/analytics`)); } catch (e) { setError(e.message); } }}>Refresh visits</button></div></aside>
    </div>
  </div>;
}
