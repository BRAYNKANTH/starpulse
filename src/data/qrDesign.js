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

export const SIGNATURE_THEMES = ['archway', 'estate', 'marquee', 'ticket', 'gallery'];
export const POSTER_THEMES = ['bright', 'dark_luxe', 'minimal_stand', 'vibrant_neon', 'warm_bistro', ...SIGNATURE_THEMES];
export const POSTER_FORMATS = ['tabletop', 'tent', 'sticker', 'poster', 'review'];
export const isSignatureTheme = theme => SIGNATURE_THEMES.includes(theme);

// True print size in CSS pixels (96 per inch), and the printed width of the QR code, quiet zone included.
export const POSTER_SIZES = {
  tabletop: { width: 384, height: 576, qr: 216 }, // 4 x 6 in, code 2.25 in
  tent: { width: 794, height: 560, qr: 208 }, // A5 sheet folded into two faces, code 2.2 in
  sticker: { width: 288, height: 288, qr: 184 }, // 3 x 3 in, code 1.9 in
  poster: { width: 794, height: 1123, qr: 440 }, // A4, code 4.6 in
};

const POSTER_IMAGE = /^(\/api\/images\/[a-f0-9-]{36}|data:image\/(png|jpeg|webp|gif);base64,[a-zA-Z0-9+/=]+|https?:\/\/\S+)$/;

// Printed stand/poster settings, saved with the shop so a design is still there next time.
export function normalizePosterDesign(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const choice = (key, allowed, fallback) => allowed.includes(source[key]) ? source[key] : fallback;
  const text = (key, fallback, max) => typeof source[key] === 'string' ? source[key].slice(0, max) : fallback;
  return {
    theme: choice('theme', POSTER_THEMES, 'bright'),
    format: choice('format', POSTER_FORMATS, 'tabletop'),
    headline: text('headline', '', 60),
    subtitle: text('subtitle', '', 90),
    logoShape: choice('logoShape', ['squircle', 'circle', 'banner'], 'squircle'),
    logoSize: choice('logoSize', ['normal', 'large', 'extra_large'], 'large'),
    showNfc: source.showNfc === true,
    cover: choice('cover', ['shop', 'custom', 'none'], 'shop'),
    coverImage: typeof source.coverImage === 'string' && source.coverImage.length <= 1500000 && POSTER_IMAGE.test(source.coverImage) ? source.coverImage : '',
    coverFocus: choice('coverFocus', ['whole', 'center', 'top', 'bottom'], 'whole'),
  };
}

// The photo a poster shows. Classic themes and stickers have no photo, so saved classic designs print exactly as before.
export function posterCover(design, shopCover, format = design.format) {
  if (!isSignatureTheme(design.theme) || format === 'sticker' || format === 'review') return '';
  if (design.cover === 'custom') return design.coverImage;
  return design.cover === 'shop' ? shopCover || '' : '';
}

export function contrastRatio(foreground, background) {
  const luminance = hex => {
    const values = hex.slice(1).match(/../g).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
  };
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}

const PAPER = '#FFFDF8';
const validHex = value => /^#[0-9a-f]{6}$/i.test(value || '');

function toHsl(hex) {
  const [r, g, b] = hex.slice(1).match(/../g).map(v => parseInt(v, 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min, l = (max + min) / 2;
  if (!delta) return [0, 0, l];
  const h = max === r ? ((g - b) / delta + 6) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return [h * 60, delta / (1 - Math.abs(2 * l - 1)), l];
}

function fromHsl(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const channel = n => { const k = (n + h / 30) % 12; return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255).toString(16).padStart(2, '0'); };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

// A deep shade of the brand colour, dark enough for light text and for printing QR dots on paper.
function deepShade(accent) {
  const [h, s, l] = toHsl(accent);
  const saturation = s < .08 ? s : Math.max(s * .8, .38);
  let lightness = Math.min(l, .3), shade = fromHsl(h, saturation, lightness);
  while (contrastRatio(shade, PAPER) < 10 && lightness > .03) { lightness -= .01; shade = fromHsl(h, saturation, lightness); }
  return shade;
}

// The brand colour used as a full field, with whichever of white or near-black reads best on it.
function brandField(accent) {
  let [h, s, l] = toHsl(accent), field = accent;
  const best = colour => Math.max(contrastRatio('#FFFFFF', colour), contrastRatio('#15120F', colour));
  while (best(field) < 4.7 && l > .05) { l -= .01; field = fromHsl(h, s, l); }
  return { field, on: contrastRatio('#FFFFFF', field) >= contrastRatio('#15120F', field) ? '#FFFFFF' : '#15120F' };
}

// Every signature design takes its colours from the shop's brand colour, and the contrast holds for any colour an owner can choose.
export function posterPalette(theme, accentColor) {
  const accent = validHex(accentColor) ? accentColor : '#385E43';
  const deep = deepShade(accent);
  const bright = brandField(accent);
  if (theme === 'estate') return { field: deep, onField: '#F6EAD2', metal: '#D9B874', plate: '#FFFDF6', ink: deep };
  if (theme === 'marquee') return { field: bright.field, onField: bright.on, metal: bright.on, plate: '#FFFFFF', ink: deep };
  if (theme === 'ticket') return { field: bright.field, onField: bright.on, metal: deep, plate: PAPER, ink: deep };
  if (theme === 'gallery') return { field: '#FBFBF9', onField: deep, metal: accent, plate: '#FBFBF9', ink: deep };
  return { field: deep, onField: PAPER, metal: '#FFFFFF66', plate: PAPER, ink: deep };
}

// Dark dots on a light plate only. The owner's code colour is used when it is strong enough, otherwise the brand's deep shade.
export function posterQrColors(palette, design) {
  const chosen = design?.foreground;
  const own = validHex(chosen) && chosen.toLowerCase() !== '#172033' && contrastRatio(chosen, palette.plate) >= 7;
  return { foreground: own ? chosen : palette.ink, background: palette.plate };
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
