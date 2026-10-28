import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createStore } from '../server/store.mjs';
import { createApi } from '../server/api.mjs';
import { hashPassword, hashToken } from '../server/auth.mjs';
import { localDatabase } from '../server/db.mjs';

// Same harness as tests/api.test.mjs: a fresh in-memory Postgres per test,
// so rate-limit counters and reset rows never leak between tests.
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
    request.signup = async (email, name = 'Owner', password = 'correct horse', options = {}) => {
      await store.createUser({ email: email.toLowerCase(), name, passwordHash: await hashPassword(password), ...options });
      return request('/api/auth/login', 'POST', { email, password });
    };
    return request;
  };
  const close = async () => { await new Promise(resolve => server.close(resolve)); await store.close(); };
  return { store, client, close, db };
}

const resetCount = async db => (await db.query('SELECT COUNT(*)::int AS n FROM password_resets'))[0].n;

test('forgot never reveals whether an email exists, and stores only a token hash', async () => {
  const { store, client, close, db } = await setup();
  const guest = client();
  try {
    await guest.signup('known@example.com');
    const unknown = await guest('/api/auth/forgot', 'POST', { email: 'nobody@example.com' });
    const known = await guest('/api/auth/forgot', 'POST', { email: 'known@example.com' });
    assert.equal(unknown.status, 200);
    assert.deepEqual(unknown.body, { ok: true });
    assert.deepEqual(known.body, { ok: true }, 'known and unknown emails get the identical reply');
    assert.equal(await resetCount(db), 1, 'only the known account gets a reset row');
    const [row] = await db.query('SELECT token_hash FROM password_resets');
    assert.match(row.token_hash, /^[a-f0-9]{64}$/, 'the stored value is a SHA-256 hash, not a raw token');
    assert.equal((await guest('/api/auth/forgot', 'POST', { email: 'not-an-email' })).status, 200, 'even a malformed email gets the generic reply');
    assert.equal(await resetCount(db), 1);
  } finally { await close(); }
});

test('reset succeeds once, signs out other devices, and the old password stops working', async () => {
  const { store, client, close } = await setup();
  const owner = client(), laptop = client(), guest = client();
  try {
    await owner.signup('owner@example.com');
    await laptop('/api/auth/login', 'POST', { email: 'owner@example.com', password: 'correct horse' });
    const userId = (await store.userByEmail('owner@example.com')).id;
    await store.createPasswordReset(hashToken('reset-token-1'), userId, Date.now() + 3600000);
    assert.equal((await guest('/api/auth/reset', 'POST', { token: 'reset-token-1', newPassword: 'brand new password' })).status, 200);
    assert.equal((await guest('/api/auth/login', 'POST', { email: 'owner@example.com', password: 'correct horse' })).status, 401, 'the old password no longer works');
    assert.equal((await guest('/api/auth/login', 'POST', { email: 'owner@example.com', password: 'brand new password' })).status, 200);
    assert.equal((await laptop('/api/auth/me')).status, 401, 'other devices are signed out');
    assert.equal((await owner('/api/auth/me')).status, 401, 'the requesting session is signed out too');
  } finally { await close(); }
});

test('expired, reused and invalid reset tokens are refused, and the password is unchanged', async () => {
  const { store, client, close } = await setup();
  const guest = client();
  try {
    await guest.signup('owner@example.com');
    const userId = (await store.userByEmail('owner@example.com')).id;
    await store.createPasswordReset(hashToken('expired-token'), userId, Date.now() - 1000);
    assert.equal((await guest('/api/auth/reset', 'POST', { token: 'expired-token', newPassword: 'brand new password' })).status, 400);
    await store.createPasswordReset(hashToken('once-token'), userId, Date.now() + 3600000);
    assert.equal((await guest('/api/auth/reset', 'POST', { token: 'once-token', newPassword: 'brand new password' })).status, 200);
    assert.equal((await guest('/api/auth/reset', 'POST', { token: 'once-token', newPassword: 'another password' })).status, 400, 'a token cannot be reused');
    assert.equal((await guest('/api/auth/reset', 'POST', { token: 'never-existed', newPassword: 'another password' })).status, 400);
    assert.equal((await guest('/api/auth/login', 'POST', { email: 'owner@example.com', password: 'brand new password' })).status, 200, 'only the one successful reset changed the password');
  } finally { await close(); }
});

test('a weak new password does not burn a valid reset token', async () => {
  const { store, client, close } = await setup();
  const guest = client();
  try {
    await guest.signup('owner@example.com');
    const userId = (await store.userByEmail('owner@example.com')).id;
    await store.createPasswordReset(hashToken('good-token'), userId, Date.now() + 3600000);
    assert.equal((await guest('/api/auth/reset', 'POST', { token: 'good-token', newPassword: 'short' })).status, 400);
    assert.equal((await guest('/api/auth/reset', 'POST', { token: 'good-token', newPassword: 'brand new password' })).status, 200, 'the same token still works after a weak-password attempt');
  } finally { await close(); }
});

test('forgot requests are rate-limited per address', async () => {
  const { client, close } = await setup();
  const guest = client();
  try {
    for (let i = 0; i < 10; i++) assert.equal((await guest('/api/auth/forgot', 'POST', { email: 'nobody@example.com' })).status, 200);
    assert.equal((await guest('/api/auth/forgot', 'POST', { email: 'nobody@example.com' })).status, 429);
  } finally { await close(); }
});

test('an admin password reset and a password change both invalidate pending reset tokens', async () => {
  const { store, client, close } = await setup();
  const admin = client(), owner = client(), guest = client();
  try {
    await admin.signup('admin@example.com', 'Admin', 'admin password', { role: 'admin', plan: 'business' });
    await owner.signup('owner@example.com');
    const userId = (await store.userByEmail('owner@example.com')).id;
    await store.createPasswordReset(hashToken('admin-killed-token'), userId, Date.now() + 3600000);
    const firstReset = await admin(`/api/accounts/${userId}`, 'PATCH', { resetPassword: true });
    assert.equal(firstReset.status, 200);
    assert.equal((await guest('/api/auth/reset', 'POST', { token: 'admin-killed-token', newPassword: 'brand new password' })).status, 400, 'an admin reset kills a pending email-reset token');

    await store.createPasswordReset(hashToken('change-killed-token'), userId, Date.now() + 3600000);
    // The owner is signed out by the admin reset; sign in with the temporary
    // password from that same reset (no second admin reset here, or it
    // would kill the token under test), then change it normally.
    const tempLogin = await owner('/api/auth/login', 'POST', { email: 'owner@example.com', password: firstReset.body.password });
    assert.equal(tempLogin.body.user.mustChangePassword, true);
    assert.equal((await owner('/api/auth/me', 'PATCH', { newPassword: 'my own password' })).status, 200);
    assert.equal((await guest('/api/auth/reset', 'POST', { token: 'change-killed-token', newPassword: 'brand new password' })).status, 400, 'a password change kills a pending email-reset token');
  } finally { await close(); }
});
