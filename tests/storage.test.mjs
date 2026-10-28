import test from 'node:test';
import assert from 'node:assert/strict';
import { getStoredBusinessProfile, saveStoredBusinessProfile } from '../src/data/presets.js';
import { validateProfile } from '../server/store.mjs';
import { MENU_TEMPLATES, normalizeMenuDesign, resolveMenuDesign } from '../src/data/menuDesign.js';

test('invalid or blocked browser cache recovers to a usable new shop', () => {
  for (const value of ['null', '[]', '"text"', '{broken', '{"id":"../bad","name":"Invalid"}']) {
    globalThis.localStorage = { getItem: () => value };
    const profile = getStoredBusinessProfile();
    assert.match(profile.id, /^[a-z2-9]{10}$/, 'new shops get a short ID for printed QR links'); assert.deepEqual(profile.menu, []);
  }
  globalThis.localStorage = { getItem: () => { throw new Error('Blocked'); }, setItem: () => { throw new Error('Quota exceeded'); } };
  assert.doesNotThrow(() => getStoredBusinessProfile());
  assert.doesNotThrow(() => saveStoredBusinessProfile({ id: 'shop-test' }));
});

test('legacy profiles receive defaults and invalid template settings cannot reach the customer renderer', () => {
  assert.equal(validateProfile({ name: 'Legacy shop' }, 'legacy-shop').menuDesign.template, 'garden');
  const invalid = normalizeMenuDesign({ template: 'unknown', accent: 'url(javascript:alert(1))', layout: {}, font: 'unknown', title: 'x'.repeat(200) });
  assert.equal(invalid.template, 'garden'); assert.equal(invalid.accent, ''); assert.equal(invalid.layout, 'template'); assert.equal(invalid.title.length, 100);
  for (const template of MENU_TEMPLATES) {
    const resolved = resolveMenuDesign({ template: template.id });
    assert.equal(resolved.layout, template.layout); assert.equal(resolved.accent, template.accent); assert.equal(resolved.font, template.font);
  }
  const custom = resolveMenuDesign({ template: 'midnight', layout: 'cards', font: 'serif', accent: '#ff0000', showImages: false, title: 'Dinner ' });
  assert.equal(custom.layout, 'cards'); assert.equal(custom.font, 'serif'); assert.equal(custom.accent, '#ff0000'); assert.equal(custom.showImages, false); assert.equal(custom.title, 'Dinner ');
});

test('menu validation rejects blank prices and script image URLs but accepts a free item', () => {
  const profile = { name: 'Cafe', menu: [{ name: 'Water', price: 0 }] };
  assert.equal(validateProfile(profile, 'shop-test').menu[0].price, 0);
  const uploaded = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
  const withPhotos = validateProfile({ ...profile, logo: uploaded, coverImage: uploaded, menu: [{ ...profile.menu[0], image: uploaded }] }, 'shop-test');
  assert.equal(withPhotos.logo, uploaded); assert.equal(withPhotos.coverImage, uploaded); assert.equal(withPhotos.menu[0].image, uploaded);
  assert.throws(() => validateProfile({ ...profile, menu: [{ name: 'Water', price: '' }] }, 'shop-test'));
  assert.throws(() => validateProfile({ ...profile, logo: 'javascript:alert(1)' }, 'shop-test'));
});

test('menu design options normalise, fall back to template defaults and keep text readable', () => {
  const clean = normalizeMenuDesign({ template: 'trattoria', layout: 'tiles', font: 'bebas', columns: '3', cardStyle: 'bogus', radius: 'round', background: '#1a1a2e', surface: 'red' });
  assert.equal(clean.layout, 'tiles'); assert.equal(clean.font, 'bebas'); assert.equal(clean.columns, '3');
  assert.equal(clean.cardStyle, 'template'); assert.equal(clean.surface, '');
  const resolved = resolveMenuDesign(clean);
  assert.equal(resolved.options.pricePosition, 'leader', 'unset options use the template default');
  assert.equal(resolved.options.radius, 'round');
  assert.match(resolved.classes, /mo-columns-3/); assert.match(resolved.classes, /mo-font/);
  assert.equal(resolved.palette.text, '#ffffff', 'dark background switches to light text');
  assert.equal(resolved.palette.cardText, '#2b1d16', 'cards keep dark text on a light surface');
  assert.equal(resolved.vars['--menu-heading-weight'], 400);
  assert.match(resolveMenuDesign({ template: 'garden' }).classes, /mo-cardStyle-elevated/, 'restyled templates apply their own defaults');
  assert.match(resolveMenuDesign({ template: 'garden', cardStyle: 'flat' }).classes, /mo-cardStyle-flat/, 'an owner choice still overrides the template default');
  assert.ok(MENU_TEMPLATES.length >= 20);
  assert.ok(MENU_TEMPLATES.every(t => !t.sample || ['cafe', 'restaurant', 'burger'].includes(t.sample) || t.defaults), 'new templates define structure defaults');
});

test('every menu template keeps text, prices and accent buttons at 4.5:1 or better, including custom colours', () => {
  const luminance = hex => hex.slice(1).match(/../g).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m); return (x + .05) / (y + .05); };
  for (const template of MENU_TEMPLATES) for (const custom of [{}, { background: '#ffffff' }, { background: '#111111' }, { accent: '#ffee00' }, { surface: '#222222' }]) {
    const design = resolveMenuDesign({ template: template.id, ...custom });
    const { palette: p, vars: v } = design;
    for (const [part, fg, bg] of [['text', p.text, p.background], ['muted', p.muted, p.background], ['card text', p.cardText, p.surface], ['accent on page', v['--menu-accent-on-bg'], p.background], ['accent on card', v['--menu-accent-on-surface'], p.surface], ['text on accent', v['--menu-on-accent'], design.accent]]) {
      assert.ok(contrast(fg, bg) >= 4.5, `${template.id} ${JSON.stringify(custom)}: ${part} ${fg} on ${bg} is ${contrast(fg, bg).toFixed(2)}:1`);
    }
  }
});

test('prices use each currency’s home formatting and its own decimals', async () => {
  const { formatMoney } = await import('../src/utils/money.js');
  assert.equal(formatMoney(1450, 'LKR').replace(/ /g, ' '), 'LKR 1,450.00');
  assert.equal(formatMoney(8.5, 'USD'), '$8.50');
  assert.equal(formatMoney(8.5, 'USD', 'number'), '8.50');
  assert.equal(formatMoney(1200, 'JPY', 'number'), '1,200', 'yen has no decimals');
  assert.equal(formatMoney(5, 'XXX', 'number'), '5.00', 'unknown currencies still format');
  assert.equal(formatMoney('abc', 'USD'), '$0.00');
});

test('poster designs are saved with safe defaults, and the old Google theme becomes Bright', async () => {
  const { normalizePosterDesign } = await import('../src/data/qrDesign.js');
  assert.deepEqual(normalizePosterDesign(), { theme: 'bright', format: 'tabletop', headline: '', subtitle: '', logoShape: 'squircle', logoSize: 'large', showNfc: false });
  const saved = normalizePosterDesign({ theme: 'warm_bistro', format: 'tent', headline: 'x'.repeat(80), showNfc: true, logoSize: 'huge' });
  assert.equal(saved.theme, 'warm_bistro'); assert.equal(saved.format, 'tent'); assert.equal(saved.headline.length, 60); assert.equal(saved.showNfc, true); assert.equal(saved.logoSize, 'large');
  assert.equal(normalizePosterDesign({ theme: 'google_deluxe' }).theme, 'bright');
  const profile = validateProfile({ name: 'Cafe', posterDesign: { theme: 'dark_luxe', headline: 'Scan me' } }, 'cafe');
  assert.equal(profile.posterDesign.theme, 'dark_luxe'); assert.equal(profile.posterDesign.headline, 'Scan me');
});
