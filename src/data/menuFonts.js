// Google Font pairings for menu headings and body text. Fonts load on demand.
export const FONT_PAIRS = [
  { id: 'inter', name: 'Inter', note: 'Clean modern', heading: 'Inter', body: 'Inter', fallback: 'sans-serif' },
  { id: 'poppins', name: 'Poppins', note: 'Geometric', heading: 'Poppins', body: 'Poppins', fallback: 'sans-serif' },
  { id: 'montserrat', name: 'Montserrat', note: 'Confident', heading: 'Montserrat', body: 'Inter', fallback: 'sans-serif' },
  { id: 'spacegrotesk', name: 'Space Grotesk', note: 'Contemporary', heading: 'Space Grotesk', body: 'Inter', fallback: 'sans-serif' },
  { id: 'josefin', name: 'Josefin Sans', note: 'Minimal', heading: 'Josefin Sans', body: 'Josefin Sans', fallback: 'sans-serif' },
  { id: 'playfair', name: 'Playfair Display', note: 'Elegant', heading: 'Playfair Display', weight: 600, body: 'Lato', fallback: 'Georgia, serif' },
  { id: 'cormorant', name: 'Cormorant', note: 'Fine dining', heading: 'Cormorant Garamond', weight: 600, body: 'Lato', fallback: 'Georgia, serif' },
  { id: 'dmserif', name: 'DM Serif', note: 'Bistro', heading: 'DM Serif Display', weight: 400, body: 'DM Sans', fallback: 'Georgia, serif' },
  { id: 'fraunces', name: 'Fraunces', note: 'Editorial', heading: 'Fraunces', weight: 600, body: 'Inter', fallback: 'Georgia, serif' },
  { id: 'lora', name: 'Lora', note: 'Warm serif', heading: 'Lora', weight: 600, body: 'Lora', fallback: 'Georgia, serif' },
  { id: 'merriweather', name: 'Merriweather', note: 'Traditional', heading: 'Merriweather', body: 'Source Sans 3', fallback: 'Georgia, serif' },
  { id: 'oswald', name: 'Oswald', note: 'Bold condensed', heading: 'Oswald', body: 'Inter', fallback: 'sans-serif' },
  { id: 'bebas', name: 'Bebas Neue', note: 'Poster', heading: 'Bebas Neue', weight: 400, body: 'DM Sans', fallback: 'Impact, sans-serif' },
  { id: 'archivo', name: 'Archivo Black', note: 'Chunky', heading: 'Archivo Black', weight: 400, body: 'Archivo', fallback: 'sans-serif' },
  { id: 'abril', name: 'Abril Fatface', note: 'Retro', heading: 'Abril Fatface', weight: 400, body: 'Lato', fallback: 'Georgia, serif' },
  { id: 'righteous', name: 'Righteous', note: 'Diner', heading: 'Righteous', weight: 400, body: 'Nunito', fallback: 'sans-serif' },
  { id: 'fredoka', name: 'Fredoka', note: 'Friendly', heading: 'Fredoka', body: 'Nunito', fallback: 'sans-serif' },
  { id: 'pacifico', name: 'Pacifico', note: 'Script', heading: 'Pacifico', weight: 400, body: 'Nunito', fallback: 'cursive' },
  { id: 'caveat', name: 'Caveat', note: 'Handwritten', heading: 'Caveat', body: 'Nunito', fallback: 'cursive' },
];

// Weight axes each family actually supports; requesting a missing weight fails the whole stylesheet.
const AXES = { 'Bebas Neue': '', 'Archivo Black': '', 'Abril Fatface': '', Righteous: '', Pacifico: '', 'DM Serif Display': '', Merriweather: ':wght@400;700', Lato: ':wght@400;700' };
const axis = family => family in AXES ? AXES[family] : ':wght@400;500;600;700';

export const fontPair = id => FONT_PAIRS.find(pair => pair.id === id) || null;

// Non-Latin text (Sinhala/Tamil dish names) falls back to Noto before the generic family:
// the primary Latin font has no Sinhala/Tamil glyphs, so without this the browser would
// jump straight to an unrelated system font while letter-spacing/uppercase still apply.
export const fontStack = (family, fallback) => `'${family}', 'Noto Sans Sinhala', 'Noto Sans Tamil', ${fallback}`;

export function loadFonts(pairs) {
  if (typeof document === 'undefined') return;
  const families = [...new Set(pairs.filter(Boolean).flatMap(pair => [pair.heading, pair.body]))].filter(family => family !== 'Inter');
  const missing = families.filter(family => !document.querySelector(`link[data-menu-font="${family}"]`));
  for (const family of missing) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.dataset.menuFont = family;
    link.href = `https://fonts.googleapis.com/css2?family=${family.replaceAll(' ', '+')}${axis(family)}&display=swap`;
    document.head.appendChild(link);
  }
}
