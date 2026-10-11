import { validateProfile } from './store.mjs';
import { SESSION_COOKIE, temporaryPassword, hashPassword, hashToken, newSessionToken, readCookie, sessionCookie, validEmail, validPassword, verifyPassword, SESSION_DAYS } from './auth.mjs';
import { PLANS, planFor } from '../src/data/plans.js';

const fail = (status, message) => Object.assign(new Error(message), { status });

// Fixed-window limiter keyed by client address.
function rateLimiter(limit, windowMs) {
  const hits = new Map();
  return key => {
    const now = Date.now();
    for (const [k, value] of hits) if (value.reset < now) hits.delete(k);
    const entry = hits.get(key) || { count: 0, reset: now + windowMs };
    hits.set(key, entry);
    return ++entry.count <= limit;
  };
}

export function createApi(store) {
  const feedbackLimit = rateLimiter(20, 60000);
  const authLimit = rateLimiter(10, 15 * 60000);
  const send = (res, status, data, headers = {}) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers }); res.end(JSON.stringify(data)); };
  const maxBody = 4 * 1024 * 1024;
  const readBody = async req => {
    if (Number(req.headers['content-length']) > maxBody) throw fail(413, 'Upload is too large. Use smaller images.');
    const chunks = [];
    let size = 0;
    for await (const chunk of req) { size += chunk.length; if (size > maxBody) throw fail(413, 'Upload is too large. Use smaller images.'); chunks.push(chunk); }
    try { return JSON.parse(Buffer.concat(chunks, size).toString('utf8')); } catch { throw new Error('Invalid JSON request.'); }
  };
  const readObject = async req => {
    const body = await readBody(req);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid request.');
    return body;
  };
  const account = user => {
    const plan = planFor(user.plan);
    return { user, plan, usage: { shops: store.countProfiles(user.id) } };
  };
  const startSession = (req, user) => {
    const token = newSessionToken();
    store.createSession(hashToken(token), user.id, Date.now() + SESSION_DAYS * 86400000);
    return { 'Set-Cookie': sessionCookie(req, token) };
  };

  return async (req, res, next) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname.startsWith('/q/')) {
      const id = pathname.slice(3);
      const profile = store.profile(id);
      if (!['GET', 'HEAD'].includes(req.method)) return send(res, 405, { error: 'Method not allowed.' });
      if (!profile?.published) return send(res, 404, { error: 'This QR destination is unavailable or unpublished.' });
      const destination = profile.qrDestination || 'landing';
      const target = destination === 'url' ? profile.qrUrl : `/?biz=${encodeURIComponent(id)}${destination === 'landing' ? '' : '&view=' + destination}`;
      if (!target) return send(res, 404, { error: 'The QR destination has not been configured.' });
      try { if (req.method === 'GET') store.recordVisit(id); } catch { return send(res, 503, { error: 'This QR link is temporarily unavailable.' }); }
      res.writeHead(302, { Location: target, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(); return;
    }
    if (!pathname.startsWith('/api/')) return next();
    try {
      if (!['GET', 'HEAD'].includes(req.method)) {
        // Session cookies make every write a CSRF target: refuse other origins and anything a plain HTML form could send.
        if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return send(res, 403, { error: 'Cross-origin writes are not allowed.' });
        if (!/^application\/json\b/.test(req.headers['content-type'] || '')) return send(res, 415, { error: 'Send requests as JSON.' });
      }
      const clientKey = req.socket.remoteAddress;
      const token = readCookie(req, SESSION_COOKIE);
      const tokenHash = token ? hashToken(token) : '';
      const user = tokenHash ? store.sessionUser(tokenHash) : null;

      // Accounts. There is no public sign-up: administrators create accounts under /api/accounts.
      if (pathname === '/api/auth/login' && req.method === 'POST') {
        if (!authLimit(clientKey)) return send(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
        const body = await readObject(req);
        const found = validEmail(body.email) ? store.userByEmail(body.email.trim()) : null;
        const ok = await verifyPassword(typeof body.password === 'string' ? body.password : '', found ? store.passwordHash(found.id) : undefined);
        if (!found || !ok) return send(res, 401, { error: 'Email or password is incorrect.' });
        return send(res, 200, account(found), startSession(req, found));
      }
      if (pathname === '/api/auth/logout' && req.method === 'POST') {
        if (tokenHash) store.deleteSession(tokenHash);
        return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(req, '', 0) });
      }
      if (pathname.startsWith('/api/auth/') || pathname.startsWith('/api/admin/') || pathname.startsWith('/api/accounts')) {
        if (!user) return send(res, 401, { error: 'Sign in to manage your shops.' });
        // A temporary password from an administrator must be replaced before anything else.
        if (user.mustChangePassword && !pathname.startsWith('/api/auth/')) return send(res, 403, { error: 'Choose a new password to continue.' });
      }
      if (pathname === '/api/auth/me') {
        if (req.method === 'GET') return send(res, 200, account(user));
        if (req.method === 'PATCH') {
          const body = await readObject(req);
          const changes = {};
          if (body.name !== undefined) {
            changes.name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : '';
            if (!changes.name) throw new Error('Enter your name.');
          }
          if (body.newPassword !== undefined) {
            if (!validPassword(body.newPassword)) throw new Error('Use a new password of at least 8 characters.');
            // Right after signing in with a temporary password, that password does not have to be typed again.
            if (!user.mustChangePassword && !await verifyPassword(String(body.currentPassword || ''), store.passwordHash(user.id))) throw fail(403, 'Your current password is incorrect.');
            changes.passwordHash = await hashPassword(body.newPassword);
          }
          if (changes.passwordHash) changes.mustChangePassword = false;
          const updated = store.updateUser(user.id, changes);
          // A password change signs out every other device.
          if (changes.passwordHash) store.deleteOtherSessions(user.id, tokenHash);
          return send(res, 200, account(updated));
        }
      }

      // Administration: client accounts and shop ownership.
      if (pathname.startsWith('/api/accounts')) {
        if (user.role !== 'admin') return send(res, 403, { error: 'Only administrators can manage accounts.' });
        const text = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
        if (pathname === '/api/accounts' && req.method === 'GET') return send(res, 200, { accounts: store.users(), shops: store.allShops() });
        if (pathname === '/api/accounts' && req.method === 'POST') {
          const body = await readObject(req);
          const name = text(body.name, 100);
          if (!name) throw new Error('Enter the client’s name.');
          if (!validEmail(body.email)) throw new Error('Enter a valid email address.');
          if (body.plan !== undefined && !PLANS[body.plan]) throw new Error('Choose a valid plan.');
          const password = temporaryPassword();
          const created = store.createUser({ email: body.email.trim().toLowerCase(), name, plan: body.plan || 'free', passwordHash: await hashPassword(password), mustChangePassword: true });
          return send(res, 201, { account: { ...created, shops: 0 }, password });
        }
        const target = pathname.match(/^\/api\/accounts\/([a-f0-9-]{36})$/);
        const targetUser = target && store.user(target[1]);
        if (target && !targetUser) return send(res, 404, { error: 'Account not found.' });
        if (targetUser && req.method === 'PATCH') {
          const body = await readObject(req);
          const changes = {};
          if (body.name !== undefined) { changes.name = text(body.name, 100); if (!changes.name) throw new Error('Enter the client’s name.'); }
          if (body.plan !== undefined) { if (!PLANS[body.plan]) throw new Error('Choose a valid plan.'); changes.plan = body.plan; }
          let password;
          if (body.resetPassword === true) {
            password = temporaryPassword();
            Object.assign(changes, { passwordHash: await hashPassword(password), mustChangePassword: true });
          }
          const updated = store.updateUser(targetUser.id, changes);
          if (password) store.deleteSessions(targetUser.id);
          return send(res, 200, { account: { ...updated, shops: store.countProfiles(updated.id) }, ...(password ? { password } : {}) });
        }
        if (targetUser && req.method === 'DELETE') {
          if (targetUser.id === user.id) throw new Error('You cannot delete your own account.');
          store.deleteUser(targetUser.id);
          return send(res, 200, { ok: true });
        }
        const ownership = pathname.match(/^\/api\/accounts\/shops\/([a-z0-9-]{1,80})$/);
        if (ownership && req.method === 'PUT') {
          const body = await readObject(req);
          if (body.ownerId !== null && !store.user(String(body.ownerId))) throw new Error('Choose an account.');
          if (!store.setOwner(ownership[1], body.ownerId)) return send(res, 404, { error: 'Shop not found.' });
          return send(res, 200, { ok: true });
        }
      }

      // Shop management, scoped to the signed-in owner. Other owners' shops answer 404 so IDs are not confirmed.
      if (pathname === '/api/admin/profiles' && req.method === 'GET') return send(res, 200, store.profiles(user.id));
      if (pathname === '/api/admin/overview' && req.method === 'GET') return send(res, 200, store.overview(user.id));
      const shop = pathname.match(/^\/api\/admin\/businesses\/([a-z0-9-]{1,80})(\/.*)?$/);
      if (shop) {
        const [, id, rest = ''] = shop;
        const owner = store.ownerOf(id);
        if (!rest && req.method === 'PUT') {
          if (owner === undefined) {
            const plan = planFor(user.plan);
            if (store.countProfiles(user.id) >= plan.shops) throw fail(403, `Your ${plan.name} plan includes ${plan.shops} shop${plan.shops === 1 ? '' : 's'}. Upgrade your plan to add more.`);
          } else if (owner !== user.id) return send(res, 404, { error: 'Shop not found.' });
          return send(res, 200, store.save(validateProfile(await readBody(req), id), user.id));
        }
        if (owner !== user.id) return send(res, 404, { error: 'Shop not found.' });
        if (!rest && req.method === 'DELETE') { store.deleteProfile(id); return send(res, 200, { ok: true }); }
        if (rest === '/analytics' && req.method === 'GET') return send(res, 200, store.visits(id));
        if (rest === '/feedback') {
          if (req.method === 'GET') return send(res, 200, store.feedback(id));
          if (req.method === 'PATCH') {
            const body = await readBody(req);
            const ids = body?.ids === 'all' ? 'all' : Array.isArray(body?.ids) && body.ids.length <= 1000 && body.ids.every(value => typeof value === 'string') ? body.ids : null;
            if (!ids || typeof body.read !== 'boolean') throw new Error('Choose feedback to mark as read or unread.');
            return send(res, 200, { updated: store.markFeedback(id, ids, body.read) });
          }
          if (req.method === 'DELETE') { store.clearFeedback(id); return send(res, 200, { ok: true }); }
        }
        const feedbackItem = rest.match(/^\/feedback\/([a-z0-9-]{1,80})$/);
        if (feedbackItem && req.method === 'DELETE') {
          if (!store.deleteFeedback(id, feedbackItem[1])) return send(res, 404, { error: 'Feedback not found.' });
          return send(res, 200, { ok: true });
        }
      }

      // Customer pages
      const publicRoute = pathname.match(/^\/api\/businesses\/([a-z0-9-]{1,80})(\/feedback)?$/);
      if (publicRoute) {
        const [, id, feedback] = publicRoute;
        const profile = store.profile(id);
        if (!profile?.published) return send(res, 404, { error: 'This shop is unavailable or has not been published yet.' });
        // Hidden items stay out of the public response, not just out of the rendered menu.
        if (!feedback && req.method === 'GET') return send(res, 200, { ...profile, menu: (profile.menu || []).filter(item => item.available !== false) });
        if (feedback && req.method === 'POST') {
          if (!feedbackLimit(clientKey)) return send(res, 429, { error: 'Please wait a minute before submitting again.' });
          const body = await readObject(req);
          if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5 || typeof body.note !== 'string' || body.note.length > 3000) throw new Error('Choose a rating and keep your note under 3,000 characters.');
          const item = store.addFeedback({ businessId: id, rating: body.rating, note: body.note.trim(), selectedTags: Array.isArray(body.selectedTags) ? body.selectedTags.filter(t => profile.quickTags.includes(t)) : [], redirectedToGoogle: body.redirectedToGoogle === true, status: body.redirectedToGoogle ? 'Google Link Clicked' : 'Private Feedback' });
          return send(res, 201, { id: item.id });
        }
      }
      return send(res, 404, { error: 'Endpoint not found.' });
    } catch (error) { return send(res, error.status || 400, { error: error.message || 'Request failed.' }); }
  };
}
