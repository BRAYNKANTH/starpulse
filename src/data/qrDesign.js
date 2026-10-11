export const QR_PRESETS = [
  { id: 'ink', name: 'Studio Ink', foreground: '#172033', background: '#ffffff', frameColor: '#172033', frame: 'label' },
  { id: 'forest', name: 'Café Forest', foreground: '#254c3c', background: '#ffffff', frameColor: '#254c3c', frame: 'label' },
  { id: 'violet', name: 'Electric Violet', foreground: '#5130a4', background: '#ffffff', frameColor: '#734ee7', frame: 'border' },
  { id: 'terracotta', name: 'Warm Terracotta', foreground: '#873b2c', background: '#fffaf3', frameColor: '#873b2c', frame: 'label' },
];

export function normalizeQrDesign(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const color = (key, fallback) => /^#[0-9a-f]{6}$/i.test(source[key]) ? source[key] : fallback;
  return { foreground: color('foreground', '#172033'), background: color('background', '#ffffff'), frameColor: color('frameColor', '#172033'), frame: ['none', 'border', 'label'].includes(source.frame) ? source.frame : 'label', label: typeof source.label === 'string' ? source.label.slice(0, 60) : 'SCAN TO EXPLORE', rounded: source.rounded !== false, showLogo: source.showLogo === true };
}

export function contrastRatio(foreground, background) {
  const luminance = hex => {
    const values = hex.slice(1).match(/../g).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
  };
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}

export function qrPayload(type, fields) {
  if (type === 'wifi') {
    if (!fields.ssid?.trim()) throw new Error('Enter your Wi-Fi network name.');
    const escape = text => String(text || '').replace(/[\\;,:"]/g, '\\$&');
    const security = ['WPA', 'WEP', 'nopass'].includes(fields.security) ? fields.security : 'WPA';
    return `WIFI:T:${security};S:${escape(fields.ssid)};P:${security === 'nopass' ? '' : escape(fields.password)};H:${fields.hidden === true};;`;
  }
  if (type === 'whatsapp') {
    const phone = String(fields.phone || '').replace(/[\s()+-]/g, '');
    if (!/^\d{7,15}$/.test(phone)) throw new Error('Enter a phone number with country code (7–15 digits).');
    return `https://wa.me/${phone}?text=${encodeURIComponent(fields.message || '')}`;
  }
  try {
    const url = new URL(fields.url);
    if (['http:', 'https:'].includes(url.protocol)) return url.href;
  } catch { /* show a useful error below */ }
  throw new Error('Enter a full http or https website address.');
}
