import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createStore, validateProfile } from '../server/store.mjs';
import { createApi } from '../server/api.mjs';
import { hashPassword } from '../server/auth.mjs';
import { localDatabase } from '../server/db.mjs';
import { qrPayload, normalizeQrDesign, contrastRatio } from '../src/data/qrDesign.js';

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
