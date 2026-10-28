import { FONT_PAIRS, fontPair, fontStack } from './menuFonts.js';

export const TEMPLATE_GROUPS = [
  { id: 'cafe', name: 'Cafés & bakeries' },
  { id: 'restaurant', name: 'Restaurants' },
  { id: 'casual', name: 'Fast food & street' },
  { id: 'bar', name: 'Bars & lounges' },
  { id: 'fresh', name: 'Healthy & desserts' },
  { id: 'retail', name: 'Shops & services' },
];

// Each template is a palette, a default layout and font, and optional structure defaults (see MENU_OPTIONS).
export const MENU_TEMPLATES = [
  { id: 'cafe', group: 'cafe', sample: 'cafe', name: 'Bakery & Bloom', description: 'Cream paper, a café cover and a simple bakery list.', layout: 'list', accent: '#794b40', background: '#f7efe3', surface: '#fffcf7', text: '#3d2e24', muted: '#755f4e', border: '#e4d5bf', font: 'sans', eyebrow: 'FRESH FROM THE OVEN', food: true },
  { id: 'restaurant', group: 'restaurant', sample: 'restaurant', name: 'The Golden Table', description: 'A dark textured menu with gold headings and plated dishes.', layout: 'list', accent: '#e7c44e', background: '#151716', surface: '#202420', text: '#f5f1e6', muted: '#aaa99e', border: '#383c33', font: 'serif', eyebrow: 'SEASONAL KITCHEN', food: true },
  { id: 'burger', group: 'casual', sample: 'burger', name: 'Burger Club', description: 'Bold orange, food photography and category cards.', layout: 'cards', accent: '#ffc451', background: '#c2410c', surface: '#fff8ec', text: '#fff7ea', muted: '#ffedd5', border: '#df6a3f', cardText: '#392d24', font: 'sans', eyebrow: 'BIG FLAVOUR. GOOD TIMES.', food: true },
  { id: 'trattoria', group: 'restaurant', sample: 'italian', name: 'Trattoria Rosso', description: 'Italian paper menu, dotted price leaders and round dish photos.', layout: 'list', accent: '#b3261e', background: '#fbf6ec', surface: '#fffdf8', text: '#2b1d16', muted: '#7d6a5c', border: '#e3d3bd', font: 'playfair', eyebrow: 'CUCINA DI CASA', food: true, defaults: { align: 'center', pricePosition: 'leader', divider: 'dotted', sectionStyle: 'centered', navStyle: 'underline', texture: 'paper', imageShape: 'circle', imagePosition: 'right' } },
  { id: 'pizzeria', group: 'casual', sample: 'pizza', name: 'Slice Pizzeria', description: 'Poster type, price tags on photos and a three-column grid.', layout: 'cards', accent: '#d7261e', background: '#fff4e2', surface: '#ffffff', text: '#2a1a12', muted: '#7a5f4c', border: '#f1d9b5', font: 'bebas', eyebrow: 'HAND-STRETCHED DAILY', food: true, defaults: { cardStyle: 'elevated', radius: 'rounded', imageShape: 'square', pricePosition: 'tag', navStyle: 'pills', headingCase: 'upper', headingSize: 'large', sectionStyle: 'banner', columns: '3', align: 'center' } },
  { id: 'sushi', group: 'restaurant', sample: 'sushi', name: 'Sakura Sushi', description: 'Quiet Japanese minimalism with numbered sections and side photos.', layout: 'horizontal', accent: '#c8102e', background: '#faf8f5', surface: '#ffffff', text: '#1b1b1b', muted: '#6f6a64', border: '#e7e2db', font: 'josefin', eyebrow: 'OMAKASE & ROLLS', food: true, defaults: { cardStyle: 'flat', radius: 'square', imageShape: 'square', imagePosition: 'left', pricePosition: 'inline', navStyle: 'underline', sectionStyle: 'numbered', headingCase: 'upper', divider: 'line', columns: '2' } },
  { id: 'spice', group: 'restaurant', sample: 'curry', name: 'Spice Route', description: 'Deep maroon and saffron for curries, rice and street classics.', layout: 'list', accent: '#f2a93b', background: '#2a0f12', surface: '#3a1619', text: '#fbeee0', muted: '#d8b9a4', border: '#5a2a2a', font: 'cormorant', eyebrow: 'SLOW-COOKED SPICES', food: true, defaults: { align: 'center', pricePosition: 'leader', divider: 'dotted', sectionStyle: 'centered', navStyle: 'boxed', imageShape: 'circle', imagePosition: 'left', texture: 'dots', headingSize: 'large' } },
  { id: 'chalkboard', group: 'cafe', sample: 'coffee', name: 'Chalkboard Café', description: 'Chalk-style specials on a green chalkboard, now in a readable serif.', layout: 'compact', accent: '#f4d35e', background: '#1f2a24', surface: '#26332c', text: '#f1f1ea', muted: '#c2c8bd', border: '#4a5a51', font: 'lora', eyebrow: 'TODAY ON THE BOARD', food: true, defaults: { cardStyle: 'flat', pricePosition: 'leader', divider: 'dashed', sectionStyle: 'centered', navStyle: 'underline', texture: 'chalk', headingSize: 'large', align: 'center' } },
  { id: 'taqueria', group: 'casual', sample: 'tacos', name: 'Taquería Sol', description: 'Sunny colours, round cards and centred street-food tiles.', layout: 'cards', accent: '#c2410c', background: '#fff7e8', surface: '#ffffff', text: '#20323a', muted: '#5f7178', border: '#f3dcb6', font: 'righteous', eyebrow: '¡BUEN PROVECHO!', food: true, defaults: { cardStyle: 'outlined', radius: 'round', imageShape: 'wide', pricePosition: 'tag', navStyle: 'pills', sectionStyle: 'banner', texture: 'stripes', columns: '3', itemAlign: 'center', align: 'center' } },
  { id: 'greenbowl', group: 'fresh', sample: 'healthy', name: 'Green Bowl', description: 'Fresh greens, soft cards and round bowl photos.', layout: 'horizontal', accent: '#166534', background: '#f1f5ee', surface: '#ffffff', text: '#1e3326', muted: '#4f6b57', border: '#dbe6d6', font: 'fredoka', eyebrow: 'GROWN, NOT PROCESSED', food: true, defaults: { cardStyle: 'elevated', radius: 'round', imageShape: 'circle', imagePosition: 'left', pricePosition: 'inline', navStyle: 'pills', sectionStyle: 'line', columns: '2' } },
  { id: 'harbour', group: 'restaurant', sample: 'seafood', name: 'Harbour Seafood', description: 'Coastal navy and sand with full-bleed photo tiles.', layout: 'tiles', accent: '#1f6f8b', background: '#f4f1ea', surface: '#ffffff', text: '#12304a', muted: '#4f6275', border: '#dfe4e8', font: 'dmserif', eyebrow: 'FRESH FROM THE BOATS', food: true, defaults: { radius: 'soft', navStyle: 'underline', sectionStyle: 'line', columns: '3', headingSize: 'large' } },
  { id: 'ember', group: 'restaurant', sample: 'steak', name: 'Smoke & Ember', description: 'Charcoal steakhouse with ember accents and banner sections.', layout: 'list', accent: '#e07a2f', background: '#121212', surface: '#1c1b1a', text: '#f3ede4', muted: '#a89f94', border: '#34302c', font: 'oswald', eyebrow: 'WOOD-FIRED GRILL', food: true, defaults: { headingCase: 'upper', pricePosition: 'inline', divider: 'line', sectionStyle: 'banner', navStyle: 'boxed', imageShape: 'square', imagePosition: 'right', texture: 'none' } },
  { id: 'scoop', group: 'fresh', sample: 'dessert', name: 'Sweet Scoop', description: 'Pastel pink desserts with round photos and friendly headings.', layout: 'cards', accent: '#be185d', background: '#fff0f5', surface: '#ffffff', text: '#4a2340', muted: '#7a5570', border: '#f6d3e2', font: 'fredoka', eyebrow: 'LIFE IS SWEET', food: true, defaults: { cardStyle: 'elevated', radius: 'round', imageShape: 'circle', itemAlign: 'left', pricePosition: 'inline', navStyle: 'pills', sectionStyle: 'centered', texture: 'dots', columns: '3', align: 'center' } },
  { id: 'maison', group: 'restaurant', sample: 'finedining', name: 'Maison', description: 'A centred tasting menu in ivory and bronze. No photos needed.', layout: 'list', accent: '#7c5a1e', background: '#f7f3ec', surface: '#fbf8f3', text: '#1f1d1a', muted: '#6b655c', border: '#e3dbcf', font: 'cormorant', eyebrow: 'MENU DÉGUSTATION', food: true, defaults: { align: 'center', itemAlign: 'center', pricePosition: 'below', divider: 'none', sectionStyle: 'centered', navStyle: 'underline', headingCase: 'upper', texture: 'paper', imageShape: 'circle' } },
  { id: 'wok', group: 'casual', sample: 'noodles', name: 'Wok Street', description: 'Lantern red and gold for noodles, rice and street food.', layout: 'cards', accent: '#ffd23f', background: '#b8141c', surface: '#fff6e5', text: '#fff6e5', muted: '#ffedd5', border: '#d9473c', cardText: '#3a1d12', font: 'archivo', eyebrow: 'HOT FROM THE WOK', food: true, defaults: { cardStyle: 'filled', radius: 'soft', pricePosition: 'tag', navStyle: 'boxed', headingCase: 'upper', sectionStyle: 'banner', imageShape: 'wide', columns: '3' } },
  { id: 'brunch', group: 'cafe', sample: 'brunch', name: 'Sunny Side', description: 'Butter-yellow brunch menu with outlined side-photo cards.', layout: 'horizontal', accent: '#b45309', background: '#fffbea', surface: '#ffffff', text: '#3b2f1e', muted: '#7f6c52', border: '#f2e3b3', font: 'abril', eyebrow: 'ALL-DAY BRUNCH', food: true, defaults: { cardStyle: 'outlined', radius: 'rounded', imageShape: 'square', imagePosition: 'right', pricePosition: 'inline', navStyle: 'pills', sectionStyle: 'line', columns: '2' } },
  { id: 'copper', group: 'bar', sample: 'cocktails', name: 'Copper Lounge', description: 'Teal and copper cocktail list with centred dotted leaders.', layout: 'compact', accent: '#d08c5a', background: '#0f1a1c', surface: '#152427', text: '#eef3f1', muted: '#9fb3b0', border: '#2c4246', font: 'playfair', eyebrow: 'SHAKEN & STIRRED', food: true, defaults: { pricePosition: 'leader', divider: 'dotted', sectionStyle: 'centered', navStyle: 'underline', align: 'center', headingCase: 'upper', texture: 'grid', cardStyle: 'flat' } },
  { id: 'diner', group: 'casual', sample: 'diner', name: 'Retro Diner', description: 'Mint, cherry red and chunky side cards like a 50s diner.', layout: 'horizontal', accent: '#be123c', background: '#e9f4f4', surface: '#ffffff', text: '#1d2b3a', muted: '#546273', border: '#bfdcdc', font: 'righteous', eyebrow: 'OPEN LATE', food: true, defaults: { cardStyle: 'outlined', radius: 'soft', imageShape: 'square', imagePosition: 'left', pricePosition: 'tag', navStyle: 'boxed', sectionStyle: 'banner', texture: 'stripes', columns: '2' } },
  { id: 'garden', group: 'cafe', sample: 'garden', name: 'Garden Café', description: 'Leafy greens, soft rounded cards and a botanical border.', layout: 'cards', accent: '#385e43', background: '#f7f5ef', surface: '#fffef9', text: '#183329', muted: '#5a6a5d', border: '#dce3d6', font: 'lora', eyebrow: 'MADE FOR YOU', food: true, defaults: { cardStyle: 'elevated', radius: 'rounded', navStyle: 'pills', sectionStyle: 'line', imageShape: 'wide', columns: '2' } },
  { id: 'bistro', group: 'restaurant', sample: 'bistro', name: 'Classic Bistro', description: 'A printed brasserie card with double rules and dotted rows.', layout: 'list', accent: '#8b3a3a', background: '#fbf4e8', surface: '#fffaf2', text: '#382820', muted: '#716253', border: '#e2d4bd', font: 'dmserif', eyebrow: 'AT YOUR TABLE', food: true, defaults: { texture: 'paper', navStyle: 'boxed', sectionStyle: 'centered', imageShape: 'circle', imagePosition: 'right', divider: 'dotted' } },
  { id: 'midnight', group: 'bar', sample: 'midnight', name: 'Midnight Bar', description: 'A dark menu board with gold accents and outlined cards.', layout: 'compact', accent: '#e9be69', background: '#141719', surface: '#1d2226', text: '#f6eedb', muted: '#b2b4ad', border: '#3e4140', font: 'spacegrotesk', eyebrow: 'AFTER HOURS', food: true, defaults: { cardStyle: 'outlined', radius: 'soft', navStyle: 'pills', texture: 'dots' } },
  { id: 'catalog', group: 'retail', sample: 'market', name: 'Fresh Market', description: 'Large image cards for food or products, with a clean blue accent.', layout: 'cards', accent: '#245cc6', background: '#f0f4fa', surface: '#ffffff', text: '#162b4b', muted: '#56647d', border: '#dbe3ef', font: 'poppins', eyebrow: 'FIND YOUR FAVOURITES', food: true, defaults: { radius: 'rounded', navStyle: 'boxed', columns: '2' } },
  { id: 'editorial', group: 'retail', sample: 'studio', name: 'Studio Menu', description: 'Category sidebar, numbered sections and a clean editorial list.', layout: 'list', accent: '#685141', background: '#f4f1ed', surface: '#ffffff', text: '#292723', muted: '#6a635d', border: '#ddd5cd', font: 'fraunces', eyebrow: 'THOUGHTFULLY CURATED', food: true, defaults: { navStyle: 'sidebar', sectionStyle: 'numbered' } },
  // Sri Lankan templates: list/cards that stay readable with long names, LKR prices and no photos.
  { id: 'ricecurry', group: 'restaurant', sample: 'ricecurry', name: 'Rice & Curry', description: 'Warm turmeric and maroon for rice & curry, kottu and hoppers. No photos needed.', layout: 'list', accent: '#9a3412', background: '#fdf8ef', surface: '#ffffff', text: '#2b1a12', muted: '#6b5a4e', border: '#e8dcc8', font: 'lora', eyebrow: 'RICE, CURRY & EVERYTHING WITH IT', food: true, defaults: { pricePosition: 'inline', divider: 'dotted', sectionStyle: 'line', navStyle: 'pills', imageShape: 'square', imagePosition: 'right' } },
  { id: 'shorteats', group: 'cafe', sample: 'shorteats', name: 'Short Eats & Bakery', description: 'Cream and brown cards for short eats, buns and bakery favourites, with clear price tags.', layout: 'cards', accent: '#92400e', background: '#fdf6ec', surface: '#ffffff', text: '#33241a', muted: '#6f5a4a', border: '#ecdcc2', font: 'poppins', eyebrow: 'FRESH FROM THE BAKERY', food: true, defaults: { cardStyle: 'elevated', radius: 'rounded', imageShape: 'wide', pricePosition: 'tag', navStyle: 'pills', sectionStyle: 'line', columns: '2' } },
];

export const MENU_LAYOUTS = [['cards', 'Image cards'], ['horizontal', 'Side-photo cards'], ['list', 'Classic rows'], ['compact', 'Compact board'], ['tiles', 'Photo tiles']];

// Structure options. 'template' (the stored default) means "use the template's own look".
export const MENU_OPTIONS = {
  columns: [['auto', 'Auto'], ['1', '1'], ['2', '2'], ['3', '3']],
  cardStyle: [['elevated', 'Shadow'], ['outlined', 'Outline'], ['flat', 'Flat'], ['filled', 'Tinted']],
  radius: [['square', 'Square'], ['soft', 'Soft'], ['rounded', 'Rounded'], ['round', 'Extra round']],
  imageShape: [['wide', 'Wide'], ['square', 'Square'], ['circle', 'Circle']],
  imagePosition: [['left', 'Left'], ['right', 'Right']],
  align: [['left', 'Left'], ['center', 'Centre']],
  itemAlign: [['left', 'Left'], ['center', 'Centre']],
  headingCase: [['normal', 'As typed'], ['upper', 'UPPERCASE']],
  headingSize: [['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']],
  pricePosition: [['inline', 'Beside name'], ['below', 'Under name'], ['leader', 'Dotted leader'], ['tag', 'Price tag']],
  divider: [['line', 'Line'], ['dotted', 'Dotted'], ['dashed', 'Dashed'], ['none', 'None']],
  navStyle: [['pills', 'Pills'], ['underline', 'Underline'], ['boxed', 'Boxed'], ['sidebar', 'Sidebar']],
  sectionStyle: [['line', 'With rule'], ['centered', 'Centred'], ['banner', 'Banner'], ['numbered', 'Numbered']],
  texture: [['none', 'None'], ['paper', 'Paper'], ['dots', 'Dots'], ['grid', 'Grid'], ['stripes', 'Stripes'], ['chalk', 'Chalk']],
};

const HEX = /^#[0-9a-f]{6}$/i;
const FONT_IDS = ['template', 'sans', 'serif', ...FONT_PAIRS.map(pair => pair.id)];

export function normalizeMenuDesign(value) {
  const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const choice = (key, allowed, fallback) => allowed.includes(input[key]) ? input[key] : fallback;
  const text = (key, fallback, max) => typeof input[key] === 'string' ? input[key].slice(0, max) : fallback;
  const color = key => HEX.test(input[key]) ? input[key] : '';
  return {
    template: choice('template', MENU_TEMPLATES.map(t => t.id), 'garden'),
    layout: choice('layout', ['template', ...MENU_LAYOUTS.map(([id]) => id)], 'template'),
    font: choice('font', FONT_IDS, 'template'),
    density: choice('density', ['comfortable', 'compact'], 'comfortable'),
    accent: color('accent'),
    background: color('background'),
    surface: color('surface'),
    text: color('text'),
    title: text('title', 'Our menu', 100),
    subtitle: text('subtitle', '', 300),
    showCover: input.showCover !== false,
    showBrand: input.showBrand !== false,
    showImages: input.showImages !== false,
    showDescriptions: input.showDescriptions !== false,
    showPrices: input.showPrices !== false,
    showSearch: input.showSearch !== false,
    showCategories: input.showCategories !== false,
    priceStyle: choice('priceStyle', ['currency', 'number'], 'currency'),
    ...Object.fromEntries(Object.entries(MENU_OPTIONS).map(([key, values]) => [key, choice(key, ['template', ...values.map(([id]) => id)], 'template')])),
  };
}

// Design fields a template change resets, so the new template shows its own look.
export const TEMPLATE_RESET = { layout: 'template', font: 'template', accent: '', background: '', surface: '', text: '', ...Object.fromEntries(Object.keys(MENU_OPTIONS).map(key => [key, 'template'])) };

const luminance = hex => hex.slice(1).match(/../g).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m); return (x + .05) / (y + .05); };
const readableOn = (surface, preferred) => [preferred, '#1b1b1b', '#ffffff'].find(color => HEX.test(color) && contrast(color, surface) >= 4.5) || (contrast('#000000', surface) >= contrast('#ffffff', surface) ? '#000000' : '#ffffff');
const mixHex = (a, b, amount) => '#' + [0, 2, 4].map(i => Math.round(parseInt(a.slice(1 + i, 3 + i), 16) * (1 - amount) + parseInt(b.slice(1 + i, 3 + i), 16) * amount).toString(16).padStart(2, '0')).join('');
// Keeps a colour's character but moves it toward black or white just far enough to reach 4.5:1 on `surface`.
export const ensureContrast = (color, surface, minimum = 4.5) => {
  if (!HEX.test(color) || !HEX.test(surface)) return color;
  if (contrast(color, surface) >= minimum) return color;
  const target = contrast('#000000', surface) > contrast('#ffffff', surface) ? '#000000' : '#ffffff';
  for (let step = 1; step <= 20; step++) { const next = mixHex(color, target, step / 20); if (contrast(next, surface) >= minimum) return next; }
  return target;
};

export function resolveMenuDesign(value) {
  const design = normalizeMenuDesign(value);
  const template = MENU_TEMPLATES.find(t => t.id === design.template);
  const options = Object.fromEntries(Object.keys(MENU_OPTIONS).map(key => [key, design[key] !== 'template' ? design[key] : template.defaults?.[key] || null]));
  const background = design.background || template.background;
  const surface = design.surface || template.surface;
  // A new background keeps the template's text colour only while it stays readable.
  const text = ensureContrast(design.text || (design.background ? readableOn(background, template.text) : template.text), background);
  const recolored = !!(design.background || design.text);
  const palette = {
    ...template,
    background, surface, text,
    // Secondary text stays at 4.5:1 or better on the page background.
    muted: ensureContrast(recolored ? mixHex(text, background, .3) : template.muted, background),
    border: recolored ? `color-mix(in srgb, ${text} 16%, ${background})` : template.border,
    cardText: ensureContrast(design.surface || design.text || design.background ? readableOn(surface, design.text || template.cardText || template.text) : template.cardText || text, surface),
  };
  const accent = design.accent || template.accent;
  const font = design.font === 'template' ? template.font : design.font;
  const pair = fontPair(font);
  const classes = Object.entries(options).filter(([key, v]) => v && !(key === 'columns' && v === 'auto')).map(([key, v]) => `mo-${key}-${v}`);
  if (pair) classes.push('mo-font');
  if (design.surface || design.text || design.background || template.cardText) classes.push('mo-cardcolors');
  return {
    ...design, palette, options, font, fontPair: pair, classes: classes.join(' '),
    layout: design.layout === 'template' ? template.layout : design.layout,
    accent,
    sidebar: options.navStyle === 'sidebar',
    numbered: options.sectionStyle === 'numbered',
    // Accent used as text (prices, highlights) is adjusted per background so it stays readable.
    vars: { '--menu-on-accent': readableOn(accent, '#ffffff'), '--menu-card-text': palette.cardText, '--menu-accent-on-bg': ensureContrast(accent, background), '--menu-accent-on-surface': ensureContrast(accent, surface), ...(pair ? { '--menu-heading-font': fontStack(pair.heading, pair.fallback), '--menu-body-font': fontStack(pair.body, 'system-ui, sans-serif'), '--menu-heading-weight': pair.weight || 700 } : {}) },
  };
}
