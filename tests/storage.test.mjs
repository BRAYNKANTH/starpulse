import test from 'node:test';
import assert from 'node:assert/strict';
import { getStoredBusinessProfile, saveStoredBusinessProfile } from '../src/data/presets.js';
import { validateProfile } from '../server/store.mjs';
import { MENU_TEMPLATES, normalizeMenuDesign, resolveMenuDesign } from '../src/data/menuDesign.js';

test('invalid or blocked browser cache recovers to a usable new shop', () => {
  for (const value of ['null', '[]', '"text"', '{broken', '{"id":"../bad","name":"Invalid"}']) {
    globalThis.localStorage = { getItem: () => value };
    const profile = getStoredBusinessProfile();
    assert.match(profile.id, /^shop-/); assert.deepEqual(profile.menu, []);
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
  assert.equal(resolveMenuDesign({ template: 'garden' }).classes, '', 'older templates are unchanged unless customised');
  assert.ok(MENU_TEMPLATES.length >= 20);
  assert.ok(MENU_TEMPLATES.every(t => !t.sample || ['cafe', 'restaurant', 'burger'].includes(t.sample) || t.defaults), 'new templates define structure defaults');
});
