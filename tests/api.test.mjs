import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createStore } from '../server/store.mjs';
import { createApi } from '../server/api.mjs';
import { hashPassword } from '../server/auth.mjs';
import { localDatabase } from '../server/db.mjs';

// Starts an API server on a fresh in-memory Postgres. Each client keeps its own session cookie, like a browser.
async function setup() {
  const db = await localDatabase();
  const store = await createStore(db);
  const api = createApi(store);
  const server = createServer((req, res) => api(req, res, () => { res.writeHead(404); res.end(); }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const client = () => {
    let cookie = '';
    const request = async (path, method = 'GET', body, headers = {}) => {
      const response = await fetch(base + path, { method, redirect: 'manual', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...headers }, ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}) });
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) cookie = setCookie.split(';')[0].endsWith('=') ? '' : setCookie.split(';')[0];
      return { status: response.status, body: response.headers.get('content-type')?.includes('json') ? await response.json() : null, headers: response.headers };
    };
    // Accounts are created by an administrator; tests create them in the store and sign in normally.
    request.signup = async (email, name = 'Owner', password = 'correct horse', options = {}) => {
      await store.createUser({ email: email.toLowerCase(), name, passwordHash: await hashPassword(password), ...options });
      return request('/api/auth/login', 'POST', { email, password });
    };
    return request;
  };
  const close = async () => { await new Promise(resolve => server.close(resolve)); await store.close(); };
  return { store, client, close, base, db };
}

const profile = name => ({ name, published: true, currency: 'LKR', menu: [{ id: 'latte', name: 'Latte', price: 650, category: 'Coffee', available: true }], quickTags: ['Great service'] });

test('shops persist, public links resolve exact published shops, feedback reaches only the correct inbox', async () => {
  const { store, client, close, db } = await setup();
  const owner = client(), guest = client();
  try {
    assert.equal((await guest('/api/admin/profiles')).status, 401);
    assert.equal((await guest('/api/admin/businesses/shop-a', 'PUT', profile('Shop A'))).status, 401);
    assert.equal((await owner.signup('a@example.com')).status, 200);
    await store.updateUser((await store.userByEmail('a@example.com')).id, { plan: 'pro' });
    assert.equal((await owner('/api/admin/businesses/shop-a', 'PUT', profile('Shop A'))).status, 200);
    await owner('/api/admin/businesses/shop-b', 'PUT', profile('Shop B'));
    assert.equal((await guest('/api/businesses/shop-a')).body.name, 'Shop A');
    assert.equal((await guest('/api/businesses/shop-b')).body.name, 'Shop B');
    assert.equal((await guest('/api/businesses/unknown')).status, 404);
    const edited = { ...profile('Edited A'), menuDesign: { template: 'midnight', layout: 'list', title: 'Evening menu', showPrices: false, accent: '#dab86b' }, menu: [{ id: 'latte', name: 'Iced Latte', price: 800, category: 'Coffee', available: true }] };
    await owner('/api/admin/businesses/shop-a', 'PUT', edited);
    const publicShop = (await guest('/api/businesses/shop-a')).body;
    assert.equal(publicShop.name, 'Edited A'); assert.equal(publicShop.menu[0].price, 800);
    assert.equal(publicShop.menuDesign.template, 'midnight');
    assert.equal(publicShop.menuDesign.layout, 'list');
    assert.equal(publicShop.menuDesign.title, 'Evening menu');
    assert.equal(publicShop.menuDesign.showPrices, false);
    // Setting up the schema again (a new server instance) keeps existing data.
    const reopened = await createStore(db);
    assert.equal((await reopened.profile('shop-a')).menuDesign.accent, '#dab86b');
    assert.equal((await reopened.profile('shop-a')).name, 'Edited A');
    assert.equal((await guest('/api/businesses/shop-b')).body.menuDesign.template, 'garden');
    assert.equal((await guest('/api/businesses/shop-a/feedback', 'POST', { rating: 1, note: 'Please improve', selectedTags: ['Great service', 'untrusted'] })).status, 201);
    const feedback = (await owner('/api/admin/businesses/shop-a/feedback')).body;
    assert.equal(feedback.length, 1); assert.equal(feedback[0].rating, 1); assert.deepEqual(feedback[0].selectedTags, ['Great service']);
    assert.equal((await owner('/api/admin/businesses/shop-b/feedback')).body.length, 0);
    await guest('/api/businesses/shop-b/feedback', 'POST', { rating: 5, note: 'Good' });
    await owner('/api/admin/businesses/shop-a/feedback', 'DELETE', {});
    assert.equal((await store.feedback('shop-a')).length, 0); assert.equal((await store.feedback('shop-b')).length, 1);
    assert.equal((await guest('/api/businesses/shop-a/feedback', 'POST', { rating: 6, note: '' })).status, 400);
    assert.equal((await owner('/api/admin/businesses/shop-a', 'PUT', { ...edited, googleReviewUrl: 'javascript:alert(1)' })).status, 400);
    assert.equal((await owner('/api/admin/businesses/shop-a', 'PUT', { ...edited, menu: [{ name: 'Bad', price: -1 }] })).status, 400);
    await owner('/api/admin/businesses/shop-a', 'PUT', { ...edited, published: false });
    assert.equal((await guest('/api/businesses/shop-a')).status, 404);
    assert.equal((await guest('/api/businesses/shop-a/feedback', 'POST', { rating: 2, note: '' })).status, 404);
    assert.equal((await guest('/api/businesses/shop-b')).status, 200);
    assert.equal((await owner('/api/admin/businesses/shop-b', 'PUT', profile('Changed'), { Origin: 'https://other.example' })).status, 403);
    assert.equal((await owner('/api/admin/businesses/shop-b', 'PUT', JSON.stringify(profile('Changed')), { 'Content-Type': 'text/plain' })).status, 415, 'form-style writes are refused');
    assert.equal((await owner('/api/admin/businesses/shop-b', 'PUT', { ...profile('Big'), tagline: 'x'.repeat(5 * 1024 * 1024) })).status, 413);
    // A large multi-chunk body with multi-byte characters is accepted under the limit.
    const name = 'Café ☕ '.repeat(20000).slice(0, 140);
    const unicode = await owner('/api/admin/businesses/shop-b', 'PUT', { ...profile(name), tagline: 'é☕'.repeat(100000) });
    assert.equal(unicode.status, 200); assert.equal(unicode.body.name, name.trim());
  } finally { await close(); }
});

test('feedback read state, single deletes, overview stats, menu labels and hidden items', async () => {
  const { client, close } = await setup();
  const owner = client(), guest = client();
  try {
    await owner.signup('cafe@example.com');
    const menu = [
      { id: 'a', name: 'Chai', price: 400, category: 'Tea', tags: ['spicy', 'made-up', 'vegan'], soldOut: true },
      { id: 'b', name: 'Secret', price: 900, category: 'Tea', available: false },
    ];
    const saved = (await owner('/api/admin/businesses/cafe', 'PUT', { name: 'Cafe', published: true, menu })).body;
    assert.deepEqual(saved.menu[0].tags, ['vegan', 'spicy']);
    assert.equal(saved.menu[0].soldOut, true);
    assert.equal(saved.menu[1].soldOut, false);
    assert.deepEqual((await guest('/api/businesses/cafe')).body.menu.map(item => item.id), ['a'], 'hidden items are not public');

    for (const rating of [5, 4, 2]) await guest('/api/businesses/cafe/feedback', 'POST', { rating, note: `r${rating}` });
    let items = (await owner('/api/admin/businesses/cafe/feedback')).body;
    assert.ok(items.every(item => item.read === false));
    assert.equal((await guest('/api/admin/businesses/cafe/feedback', 'PATCH', { ids: [items[0].id], read: true })).status, 401);
    assert.equal((await owner('/api/admin/businesses/cafe/feedback', 'PATCH', { ids: [items[0].id], read: true })).body.updated, 1);
    assert.equal((await owner('/api/admin/businesses/cafe/feedback', 'PATCH', { ids: 'nope', read: true })).status, 400);

    let [overview] = (await owner('/api/admin/overview')).body;
    assert.equal(overview.feedback.total, 3); assert.equal(overview.feedback.unread, 2);
    assert.deepEqual(overview.feedback.distribution, [0, 1, 0, 1, 1]);
    assert.equal(overview.feedback.average.toFixed(2), '3.67');
    assert.equal(Object.values(overview.feedback.daily).reduce((a, b) => a + b, 0), 3);

    assert.equal((await owner(`/api/admin/businesses/cafe/feedback/${items[1].id}`, 'DELETE', {})).status, 200);
    assert.equal((await owner(`/api/admin/businesses/cafe/feedback/${items[1].id}`, 'DELETE', {})).status, 404);
    await owner('/api/admin/businesses/cafe/feedback', 'PATCH', { ids: 'all', read: true });
    items = (await owner('/api/admin/businesses/cafe/feedback')).body;
    assert.equal(items.length, 2); assert.ok(items.every(item => item.read));

    assert.equal((await guest('/q/cafe')).status, 302);
    [overview] = (await owner('/api/admin/overview')).body;
    assert.equal(overview.visits.count, 1);
    assert.equal(Object.values(overview.visits.daily)[0], 1);
    assert.equal(overview.feedback.unread, 0);
  } finally { await close(); }
});

test('accounts are isolated: other owners cannot list, read, edit, take over or delete a shop', async () => {
  const { client, close } = await setup();
  const alice = client(), bob = client(), guest = client();
  try {
    await alice.signup('alice@example.com', 'Alice');
    await bob.signup('bob@example.com', 'Bob');
    await alice('/api/admin/businesses/alice-cafe', 'PUT', profile('Alice Cafe'));
    await guest('/api/businesses/alice-cafe/feedback', 'POST', { rating: 4, note: 'private note' });
    assert.deepEqual((await bob('/api/admin/profiles')).body, []);
    assert.deepEqual((await bob('/api/admin/overview')).body, []);
    for (const [path, method, body] of [
      ['/api/admin/businesses/alice-cafe', 'PUT', profile('Hijacked')],
      ['/api/admin/businesses/alice-cafe', 'DELETE', {}],
      ['/api/admin/businesses/alice-cafe/feedback', 'GET'],
      ['/api/admin/businesses/alice-cafe/feedback', 'DELETE', {}],
      ['/api/admin/businesses/alice-cafe/feedback', 'PATCH', { ids: 'all', read: true }],
      ['/api/admin/businesses/alice-cafe/analytics', 'GET'],
    ]) assert.equal((await bob(path, method, body)).status, 404, `${method} ${path}`);
    assert.equal((await guest('/api/businesses/alice-cafe')).body.name, 'Alice Cafe');
    assert.equal((await alice('/api/admin/businesses/alice-cafe/feedback')).body.length, 1);
    assert.equal((await alice('/api/admin/profiles')).body.length, 1);
  } finally { await close(); }
});

test('sign-in, sessions, plan limits and password changes; there is no public sign-up', async () => {
  const { store, client, close } = await setup();
  const owner = client(), laptop = client(), stranger = client();
  try {
    assert.notEqual((await stranger('/api/auth/signup', 'POST', { name: 'Sam', email: 'sam@example.com', password: 'long enough' })).status, 201);
    assert.equal(await store.userByEmail('sam@example.com'), undefined, 'public sign-up does not exist');
    const created = await owner.signup('Sam@Example.com', 'Sam');
    assert.equal(created.status, 200);
    assert.equal(created.body.user.email, 'sam@example.com');
    assert.equal(created.body.plan.id, 'free');
    assert.match(created.headers.get('set-cookie'), /HttpOnly; SameSite=Lax/);

    assert.equal((await laptop('/api/auth/login', 'POST', { email: 'sam@example.com', password: 'wrong password' })).status, 401);
    assert.equal((await laptop('/api/auth/login', 'POST', { email: 'nobody@example.com', password: 'correct horse' })).status, 401);
    assert.equal((await laptop('/api/auth/login', 'POST', { email: 'SAM@example.com', password: 'correct horse' })).status, 200, 'emails are matched regardless of case');
    assert.equal((await laptop('/api/auth/me')).body.user.name, 'Sam');

    // Free plan: one shop. Editing it stays allowed; a second one is refused until the plan changes.
    assert.equal((await owner('/api/admin/businesses/one', 'PUT', profile('One'))).status, 200);
    assert.equal((await owner('/api/admin/businesses/one', 'PUT', profile('One again'))).status, 200);
    const limited = await owner('/api/admin/businesses/two', 'PUT', profile('Two'));
    assert.equal(limited.status, 403); assert.match(limited.body.error, /Free plan/);
    await store.updateUser(created.body.user.id, { plan: 'pro' });
    assert.equal((await owner('/api/admin/businesses/two', 'PUT', profile('Two'))).status, 200);
    assert.deepEqual((await owner('/api/auth/me')).body.usage, { shops: 2 });
    assert.equal((await owner('/api/admin/businesses/two', 'DELETE', {})).status, 200);
    assert.equal((await stranger('/api/businesses/two')).status, 404);

    assert.equal((await owner('/api/auth/me', 'PATCH', { currentPassword: 'wrong', newPassword: 'new password 1' })).status, 403);
    assert.equal((await owner('/api/auth/me', 'PATCH', { name: 'Samira', currentPassword: 'correct horse', newPassword: 'new password 1' })).body.user.name, 'Samira');
    assert.equal((await laptop('/api/auth/me')).status, 401, 'a password change signs out other devices');
    assert.equal((await owner('/api/auth/me')).status, 200, 'but keeps the current one');
    assert.equal((await owner('/api/auth/me', 'DELETE', {})).status, 404, 'owners cannot delete their own account');

    await owner('/api/auth/logout', 'POST', {});
    assert.equal((await owner('/api/auth/me')).status, 401);
    assert.equal((await owner('/api/auth/login', 'POST', { email: 'sam@example.com', password: 'new password 1' })).status, 200);
  } finally { await close(); }
});

test('administrators create client accounts with temporary passwords, manage plans and assign shops', async () => {
  const { store, client, close } = await setup();
  const admin = client(), clientUser = client(), owner = client();
  try {
    await admin.signup('admin@example.com', 'Admin', 'admin password', { role: 'admin', plan: 'business' });
    await owner.signup('owner@example.com');
    assert.equal((await owner('/api/accounts')).status, 403, 'owners cannot manage accounts');
    assert.equal((await owner('/api/accounts', 'POST', { name: 'X', email: 'x@example.com' })).status, 403);

    const made = await admin('/api/accounts', 'POST', { name: 'Nimal', email: 'Nimal@Cafe.lk', plan: 'pro' });
    assert.equal(made.status, 201);
    assert.equal(made.body.account.email, 'nimal@cafe.lk'); assert.equal(made.body.account.plan, 'pro');
    assert.equal(made.body.account.mustChangePassword, true);
    assert.match(made.body.password, /^[a-zA-Z2-9]{12}$/);
    assert.equal((await admin('/api/accounts', 'POST', { name: 'Again', email: 'nimal@cafe.lk' })).status, 409);
    assert.equal((await admin('/api/accounts', 'POST', { name: 'Bad plan', email: 'b@cafe.lk', plan: 'gold' })).status, 400);

    // The client signs in with the temporary password and must replace it before using the studio.
    const login = await clientUser('/api/auth/login', 'POST', { email: 'nimal@cafe.lk', password: made.body.password });
    assert.equal(login.body.user.mustChangePassword, true);
    assert.equal((await clientUser('/api/admin/profiles')).status, 403);
    assert.equal((await clientUser('/api/auth/me', 'PATCH', { newPassword: 'short' })).status, 400);
    assert.equal((await clientUser('/api/auth/me', 'PATCH', { newPassword: 'my own password' })).body.user.mustChangePassword, false);
    assert.equal((await clientUser('/api/admin/profiles')).status, 200);
    assert.equal((await clientUser('/api/auth/me', 'PATCH', { newPassword: 'another password' })).status, 403, 'after that, the current password is required');

    // An admin can set up a shop and hand it to the client.
    await admin('/api/admin/businesses/nimal-cafe', 'PUT', profile('Nimal Cafe'));
    const id = made.body.account.id;
    assert.equal((await admin('/api/accounts/shops/nimal-cafe', 'PUT', { ownerId: id })).status, 200);
    assert.equal((await clientUser('/api/admin/profiles')).body[0].name, 'Nimal Cafe');
    assert.equal((await admin('/api/admin/profiles')).body.length, 0);
    assert.equal((await admin('/api/accounts/shops/missing', 'PUT', { ownerId: id })).status, 404);
    assert.equal((await admin('/api/accounts/shops/nimal-cafe', 'PUT', { ownerId: 'nobody' })).status, 400);
    const listing = (await admin('/api/accounts')).body;
    assert.equal(listing.accounts.find(a => a.id === id).shops, 1);
    assert.equal(listing.shops.find(s => s.id === 'nimal-cafe').ownerId, id);

    // Plan change and password reset; a reset signs the client out everywhere.
    assert.equal((await admin(`/api/accounts/${id}`, 'PATCH', { plan: 'business' })).body.account.plan, 'business');
    const reset = await admin(`/api/accounts/${id}`, 'PATCH', { resetPassword: true });
    assert.match(reset.body.password, /^[a-zA-Z2-9]{12}$/);
    assert.equal((await clientUser('/api/auth/me')).status, 401);
    assert.equal((await clientUser('/api/auth/login', 'POST', { email: 'nimal@cafe.lk', password: 'my own password' })).status, 401);
    assert.equal((await clientUser('/api/auth/login', 'POST', { email: 'nimal@cafe.lk', password: reset.body.password })).body.user.mustChangePassword, true);

    const self = (await admin('/api/auth/me')).body.user.id;
    assert.equal((await admin(`/api/accounts/${self}`, 'DELETE', {})).status, 400, 'admins cannot delete themselves');
    assert.equal((await admin(`/api/accounts/${id}`, 'DELETE', {})).status, 200);
    assert.equal(await store.profile('nimal-cafe'), undefined, 'deleting an account deletes its shops');
    assert.equal((await admin(`/api/accounts/${id}`, 'DELETE', {})).status, 404);
  } finally { await close(); }
});

test('the old single-owner JSON store is imported once and can be claimed by an account', async () => {
  const legacy = { profiles: [{ ...profile('Legacy Cafe'), id: 'legacy-cafe' }], feedback: [{ id: 'f1', businessId: 'legacy-cafe', rating: 5, note: 'Lovely', selectedTags: [], redirectedToGoogle: false, status: 'Private Feedback', read: false, timestamp: '2026-01-02T10:00:00.000Z' }] };
  const { store, client, close } = await setup();
  const owner = client(), guest = client();
  try {
    const visits = { 'legacy-cafe': { count: 7, lastVisited: '2026-01-02T10:00:00.000Z', daily: { '2026-01-02': 7 } } };
    assert.equal(await store.importLegacy({ ...legacy, visits }), 1);
    assert.equal(await store.importLegacy({ ...legacy, visits }), 0, 'importing twice adds nothing');
    assert.equal((await guest('/api/businesses/legacy-cafe')).body.name, 'Legacy Cafe', 'imported shops stay online');
    await owner.signup('first@example.com');
    assert.equal((await owner('/api/admin/businesses/legacy-cafe', 'PUT', profile('Taken'))).status, 404, 'unclaimed shops cannot be taken over through the API');
    assert.deepEqual((await owner('/api/admin/profiles')).body, []);
    assert.equal(await store.claimUnowned((await store.userByEmail('first@example.com')).id), 1);
    const [overview] = (await owner('/api/admin/overview')).body;
    assert.equal(overview.visits.count, 7); assert.equal(overview.feedback.total, 1);
    assert.equal(overview.feedback.recent[0].timestamp, '2026-01-02T10:00:00.000Z');
  } finally { await close(); }
});
