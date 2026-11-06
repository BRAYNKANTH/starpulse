import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createStore, validateProfile } from '../server/store.mjs';
import { createApi } from '../server/api.mjs';
import { hashPassword } from '../server/auth.mjs';
import { localDatabase } from '../server/db.mjs';
import { qrPayload, normalizeQrDesign, normalizePosterDesign, contrastRatio, posterCover, posterPalette, posterQrColors, POSTER_SIZES, SIGNATURE_THEMES } from '../src/data/qrDesign.js';

// A spread of brand colours, including the awkward ones: mid grey, pure yellow, white and black.
const ACCENTS = ['#F59E0B', '#6A9A55', '#808080', '#767676', '#FFFF00', '#FFFFFF', '#000000', '#00FFFF', '#FF00FF', '#E11D48', '#385E43', '#123456', 'not a colour', undefined];

test('signature designs keep readable text and a dark-on-light QR code for any brand colour', () => {
  for (const theme of SIGNATURE_THEMES) for (const accent of ACCENTS) {
    const palette = posterPalette(theme, accent);
    const label = `${theme} on ${accent}`;
    const light = hex => contrastRatio(hex, '#000000') > contrastRatio(hex, '#FFFFFF');
    assert.ok(contrastRatio(palette.onField, palette.field) >= 4.5, `${label}: text on the field`);
    assert.ok(contrastRatio(palette.ink, palette.plate) >= 7, `${label}: words and code on the plate`);
    for (const foreground of ['#172033', '#FFFFFF', '#FFEE00', '#254C3C', 'red', undefined]) {
      const qr = posterQrColors(palette, { foreground });
      assert.ok(contrastRatio(qr.foreground, qr.background) >= 7, `${label}: code ${foreground}`);
      assert.ok(light(qr.background) && !light(qr.foreground), `${label}: code ${foreground} is not inverted`);
    }
  }
  assert.equal(posterQrColors(posterPalette('archway', '#6A9A55'), { foreground: '#254C3C' }).foreground, '#254C3C', 'a strong code colour chosen by the owner is kept');
});

test('every printed format keeps the code at least 1.9 inches wide, inside the sheet', () => {
  for (const [format, size] of Object.entries(POSTER_SIZES)) {
    assert.ok(size.qr >= 1.9 * 96, `${format} code size`);
    assert.ok(size.qr < size.width && size.qr < size.height, `${format} fits`);
  }
});

test('poster cover photos default to the shop cover, can be changed or turned off, and leave classic designs alone', async () => {
  const image = '/api/images/0f0e0d0c-0b0a-4908-8706-050403020100';
  const shop = '/api/images/aaaaaaaa-0b0a-4908-8706-050403020100';
  const design = patch => normalizePosterDesign({ theme: 'archway', ...patch });
  assert.equal(posterCover(design(), shop), shop);
  assert.equal(posterCover(design(), ''), '');
  assert.equal(posterCover(design({ cover: 'none' }), shop), '');
  assert.equal(posterCover(design({ cover: 'custom', coverImage: image }), shop), image);
  assert.equal(posterCover(design({ cover: 'custom' }), shop), '', 'no surprise photo before one is uploaded');
  assert.equal(posterCover(design({ format: 'sticker' }), shop), '', 'stickers keep the code big');
  assert.equal(posterCover(normalizePosterDesign({ theme: 'bright' }), shop), '', 'a saved classic design looks the same as before');
  assert.equal(posterCover(normalizePosterDesign({ theme: 'bright', headline: 'Saved long ago' }), shop), '');

  for (const bad of ['javascript:alert(1)', 'data:text/html;base64,AAAA', '/etc/passwd', 42, { a: 1 }, `data:image/png;base64,${'A'.repeat(1500001)}`]) assert.equal(normalizePosterDesign({ coverImage: bad }).coverImage, '');
  assert.equal(normalizePosterDesign({ cover: 'surprise' }).cover, 'shop');
  assert.equal(normalizePosterDesign({ coverFocus: 'left' }).coverFocus, 'center');
  const saved = validateProfile({ name: 'Cafe', posterDesign: { theme: 'ticket', cover: 'custom', coverImage: image, coverFocus: 'top' } }, 'cafe').posterDesign;
  assert.deepEqual([saved.theme, saved.cover, saved.coverImage, saved.coverFocus], ['ticket', 'custom', image, 'top']);
});

test('saving a shop keeps the photo its poster uses, and clears it once replaced', async () => {
  const db = await localDatabase();
  const store = await createStore(db);
  try {
    const profile = { name: 'Cafe', posterDesign: { theme: 'gallery', cover: 'custom' } };
    await store.save(validateProfile(profile, 'cafe'), null);
    const id = await store.addImage('cafe', 'image/png', 'AAAA', 10);
    await db.query("UPDATE images SET created_at = now() - interval '2 days'");
    const withPhoto = { ...profile, posterDesign: { ...profile.posterDesign, coverImage: `/api/images/${id}` } };
    await store.save(validateProfile(withPhoto, 'cafe'), null);
    assert.ok(await store.image(id), 'kept while the poster uses it');
    await store.save(validateProfile(profile, 'cafe'), null);
    assert.equal(await store.image(id), undefined, 'cleared after it is removed');
  } finally { await store.close(); }
});

test('static payloads escape Wi-Fi delimiters, validate URLs, and preserve WhatsApp messages', () => {
  assert.equal(qrPayload('wifi', { ssid: 'Cafe;Guest', password: 'a:b\\c', security: 'WPA' }), 'WIFI:T:WPA;S:Cafe\\;Guest;P:a\\:b\\\\c;H:false;;');
  assert.equal(qrPayload('wifi', { ssid: 'Open', password: 'secret', security: 'nopass', hidden: true }), 'WIFI:T:nopass;S:Open;P:;H:true;;');
  assert.equal(qrPayload('whatsapp', { phone: '+94 77 123 4567', message: 'Hi & hello' }), 'https://wa.me/94771234567?text=Hi%20%26%20hello');
  assert.throws(() => qrPayload('url', { url: 'javascript:alert(1)' }));
  assert.throws(() => qrPayload('wifi', { ssid: '' }));
  assert.throws(() => qrPayload('whatsapp', { phone: 'abc' }));
  assert.equal(normalizeQrDesign({ foreground: 'red', frame: 'bad' }).foreground, '#172033');
  assert.equal(contrastRatio('#000000', '#ffffff'), 21);
  assert.throws(() => validateProfile({ name: 'Bad', qrUrl: 'javascript:alert(1)' }, 'shop'));
});

test('printed dynamic links follow updated destinations, persist visits, and respect publishing and owner access', async () => {
  const db = await localDatabase();
  const store = await createStore(db);
  const owner = await store.createUser({ email: 'owner@example.com', name: 'Owner', passwordHash: await hashPassword('correct horse') });
  const profile = { name: 'Cafe', published: true, qrDestination: 'menu', qrDesign: { foreground: '#254c3c', label: ' OUR MENU ' } };
  await store.save(validateProfile(profile, 'cafe'), owner.id);
  const handler = createApi(store);
  const server = createServer((req, res) => handler(req, res, () => { res.writeHead(404); res.end(); }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const visit = (id = 'cafe', method = 'GET') => fetch(`${base}/q/${id}`, { redirect: 'manual', method });
  try {
    let response = await visit();
    assert.equal(response.status, 302); assert.equal(response.headers.get('location'), '/?biz=cafe&view=menu');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal((await store.visits('cafe')).count, 1);
    await visit('cafe', 'HEAD'); assert.equal((await store.visits('cafe')).count, 1);
    await store.save(validateProfile({ ...profile, qrDestination: 'url', qrUrl: 'https://example.com/new' }, 'cafe'), owner.id);
    response = await visit(); assert.equal(response.headers.get('location'), 'https://example.com/new');
    const reopened = await createStore(db);
    assert.equal((await reopened.visits('cafe')).count, 2);
    assert.equal((await reopened.profile('cafe')).qrDesign.label, ' OUR MENU ');
    response = await fetch(`${base}/api/admin/businesses/cafe/analytics`); assert.equal(response.status, 401);
    const login = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'owner@example.com', password: 'correct horse' }) });
    const cookie = login.headers.get('set-cookie').split(';')[0];
    response = await fetch(`${base}/api/admin/businesses/cafe/analytics`, { headers: { Cookie: cookie } }); assert.equal((await response.json()).count, 2);
    // Unavailable QR links now return a branded HTML page (Option B), not raw JSON.
    response = await visit('missing');
    assert.equal(response.status, 404);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(await response.text(), /This shop isn’t available/);
    assert.equal((await visit('cafe', 'POST')).status, 405);
    await store.save(validateProfile({ ...profile, published: false }, 'cafe'), owner.id);
    response = await visit();
    assert.equal(response.status, 404);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(await response.text(), /This shop isn’t available/);
    assert.equal((await store.visits('cafe')).count, 2);
    await store.save(validateProfile({ ...profile, qrDestination: 'url', qrUrl: '' }, 'cafe'), owner.id);
    response = await visit();
    assert.equal(response.status, 404);
    assert.match(response.headers.get('content-type'), /text\/html/);
  } finally { await new Promise(resolve => server.close(resolve)); await store.close(); }
});

test('daily visit counts older than 120 days are pruned while the all-time total is kept', async t => {
  const store = await createStore(await localDatabase());
  try {
    await store.save(validateProfile({ name: 'Cafe' }, 'cafe'), null);
    t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-01-01T12:00:00') });
    await store.recordVisit('cafe');
    t.mock.timers.setTime(Date.parse('2026-06-01T12:00:00'));
    await store.recordVisit('cafe');
    assert.equal((await store.visits('cafe')).count, 2);
    assert.deepEqual(Object.keys((await store.visits('cafe')).daily), ['2026-06-01']);
  } finally { t.mock.timers.reset(); await store.close(); }
});

test('a counted scan stops counting past its rate limit, and a current database skips setup on the next start', async () => {
  const db = await localDatabase();
  const store = await createStore(db);
  try {
    await store.save(validateProfile({ name: 'Cafe' }, 'cafe'), null);
    for (let i = 0; i < 4; i++) await store.recordScan('cafe', 'scan:device:cafe', 3, 60);
    const visits = await store.visits('cafe');
    assert.equal(visits.count, 3);
    assert.deepEqual(Object.values(visits.daily), [3]);

    const statements = [];
    await createStore({ ...db, query: (text, params) => { statements.push(text); return db.query(text, params); } });
    assert.equal(statements.length, 1);
  } finally { await store.close(); }
});
