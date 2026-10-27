import { randomUUID } from 'node:crypto';
import { normalizeQrDesign } from '../src/data/qrDesign.js';
import { normalizeMenuDesign } from '../src/data/menuDesign.js';
import { normalizeMenuTags } from '../src/data/menuTags.js';
import { safeRedirect } from './security.mjs';

export function validateProfile(input, id) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || !/^[a-z0-9-]{1,80}$/.test(id)) throw new Error('Invalid business profile.');
  const text = (value, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';
  const url = (value, image = false) => {
    const result = text(value, image ? 1500000 : 2000);
    if (!result) return '';
    if (image && /^data:image\/(png|jpeg|webp|gif);base64,[a-zA-Z0-9+/=]+$/.test(result)) return result;
    try { if (['https:', 'http:'].includes(new URL(result).protocol)) return result; } catch { /* handled below */ }
    throw new Error(image ? 'Use a valid image URL or upload a PNG, JPEG, WebP or GIF.' : 'Use a valid http or https review URL.');
  };
  const name = text(input.name, 150);
  if (!name) throw new Error('Business name is required.');
  const qrDestination = ['landing', 'menu', 'review', 'url'].includes(input.qrDestination) ? input.qrDestination : 'landing';
  const qrUrl = url(input.qrUrl);
  if (qrDestination === 'url' && qrUrl && !safeRedirect(qrUrl)) throw new Error('The QR link must be a secure https web address.');
  const menu = Array.isArray(input.menu) ? input.menu.slice(0, 200).map(item => {
    if (!item || typeof item !== 'object') throw new Error('Invalid menu item.');
    const price = Number(item.price);
    if (!['number', 'string'].includes(typeof item.price) || String(item.price).trim() === '' || !text(item.name, 150) || !Number.isFinite(price) || price < 0 || price > 10000000) throw new Error('Each menu item needs a name and a valid non-negative price.');
    return { id: text(item.id, 80) || randomUUID(), name: text(item.name, 150), category: text(item.category, 80) || 'Menu', description: text(item.description), price, image: url(item.image, true), available: item.available !== false, soldOut: item.soldOut === true, tags: normalizeMenuTags(item.tags) };
  }) : [];
  return { id, name, tagline: text(input.tagline), category: text(input.category, 80), address: text(input.address), phone: text(input.phone, 80), email: text(input.email, 150), hours: text(input.hours), logo: url(input.logo, true), coverImage: url(input.coverImage, true), googleReviewUrl: url(input.googleReviewUrl), googlePlaceId: text(input.googlePlaceId, 200), accentColor: /^#[0-9a-f]{6}$/i.test(input.accentColor) ? input.accentColor : '#F59E0B', customPrompt: text(input.customPrompt), notePlaceholder: text(input.notePlaceholder), quickTags: Array.isArray(input.quickTags) ? input.quickTags.filter(t => typeof t === 'string').slice(0, 20).map(t => text(t, 80)) : [], currency: /^[A-Z]{3}$/.test(input.currency) ? input.currency : 'LKR', menu, menuDesign: normalizeMenuDesign(input.menuDesign), qrDesign: normalizeQrDesign(input.qrDesign), qrDestination, qrUrl, published: input.published === true, themeMode: 'dark' };
}

// Statements run one at a time: the Neon HTTP driver accepts a single statement per query.
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL, password_hash TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free', role TEXT NOT NULL DEFAULT 'owner', must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
  'CREATE UNIQUE INDEX IF NOT EXISTS users_email ON users (lower(email))',
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
  'CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user_id)',
  `CREATE TABLE IF NOT EXISTS businesses (
    id TEXT PRIMARY KEY, owner_id TEXT REFERENCES users(id) ON DELETE CASCADE, data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
  'CREATE INDEX IF NOT EXISTS businesses_owner ON businesses (owner_id)',
  `CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL, note TEXT NOT NULL, selected_tags JSONB NOT NULL, redirected_to_google BOOLEAN NOT NULL,
    status TEXT NOT NULL, read BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
  'CREATE INDEX IF NOT EXISTS feedback_business ON feedback (business_id, created_at DESC)',
  `CREATE TABLE IF NOT EXISTS visit_totals (
    business_id TEXT PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE, count INTEGER NOT NULL, last_visited TIMESTAMPTZ)`,
  `CREATE TABLE IF NOT EXISTS visit_days (
    business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE, day TEXT NOT NULL, count INTEGER NOT NULL,
    PRIMARY KEY (business_id, day))`,
  'CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at TIMESTAMPTZ NOT NULL)',
];

const keepDays = 120;
// Daily figures use APP_TIME_ZONE (for example Asia/Colombo); Vercel servers run in UTC.
const timeZone = () => process.env.APP_TIME_ZONE || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const dayKey = date => date.toLocaleDateString('en-CA', { timeZone: timeZone() });
const iso = value => value == null ? null : new Date(value).toISOString();
const toFeedback = row => ({ id: row.id, businessId: row.business_id, rating: row.rating, note: row.note, selectedTags: row.selected_tags, redirectedToGoogle: row.redirected_to_google, status: row.status, read: row.read, timestamp: iso(row.created_at) });
const toUser = row => row && { id: row.id, email: row.email, name: row.name, plan: row.plan, role: row.role, mustChangePassword: row.must_change_password, createdAt: iso(row.created_at) };
const emptyVisits = () => ({ count: 0, lastVisited: null, daily: {} });

// `db` comes from server/db.mjs: { query(text, params) → rows, close() }.
export async function createStore(db) {
  for (const statement of SCHEMA) await db.query(statement);
  const q = (text, ...params) => db.query(text, params);
  const one = async (text, ...params) => (await db.query(text, params))[0];

  const visits = async id => {
    const [total, days] = await Promise.all([one('SELECT count, last_visited FROM visit_totals WHERE business_id = $1', id), q('SELECT day, count FROM visit_days WHERE business_id = $1', id)]);
    return { count: total?.count || 0, lastVisited: iso(total?.last_visited), daily: Object.fromEntries(days.map(r => [r.day, r.count])) };
  };
  // The inbox loads in one piece, so a runaway shop cannot exhaust memory: only the newest 5,000 are returned.
  const feedback = async id => (await q('SELECT * FROM feedback WHERE business_id = $1 ORDER BY created_at DESC LIMIT 5000', id)).map(toFeedback);

  return {
    close: () => db.close(),

    // Accounts and sessions
    createUser: async ({ email, name, passwordHash, plan = 'free', role = 'owner', mustChangePassword = false }) => {
      try { return toUser(await one('INSERT INTO users (id, email, name, password_hash, plan, role, must_change_password) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', randomUUID(), email, name, passwordHash, plan, role, mustChangePassword)); }
      catch (error) { if (error.code === '23505') throw Object.assign(new Error('An account with this email already exists.'), { status: 409 }); throw error; }
    },
    users: async () => (await q('SELECT users.*, (SELECT COUNT(*)::int FROM businesses WHERE owner_id = users.id) AS shops FROM users ORDER BY created_at')).map(row => ({ ...toUser(row), shops: row.shops })),
    user: async id => toUser(await one('SELECT * FROM users WHERE id = $1', id)),
    userByEmail: async email => toUser(await one('SELECT * FROM users WHERE lower(email) = lower($1)', email.trim())),
    passwordHash: async id => (await one('SELECT password_hash FROM users WHERE id = $1', id))?.password_hash,
    updateUser: async (id, changes) => {
      const columns = { name: 'name', passwordHash: 'password_hash', plan: 'plan', role: 'role', mustChangePassword: 'must_change_password' };
      for (const [key, column] of Object.entries(columns)) if (changes[key] !== undefined) await q(`UPDATE users SET ${column} = $1 WHERE id = $2`, changes[key], id);
      return toUser(await one('SELECT * FROM users WHERE id = $1', id));
    },
    deleteUser: async id => (await q('DELETE FROM users WHERE id = $1 RETURNING id', id)).length > 0,
    createSession: async (tokenHash, userId, expiresAt) => {
      await q('DELETE FROM sessions WHERE expires_at < now()');
      await q('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)', tokenHash, userId, new Date(expiresAt).toISOString());
    },
    sessionUser: async tokenHash => toUser(await one('SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE token_hash = $1 AND expires_at > now()', tokenHash)),
    deleteSession: async tokenHash => { await q('DELETE FROM sessions WHERE token_hash = $1', tokenHash); },
    deleteOtherSessions: async (userId, keepHash) => { await q('DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2', userId, keepHash); },
    deleteSessions: async userId => { await q('DELETE FROM sessions WHERE user_id = $1', userId); },
    claimUnowned: async userId => (await q('UPDATE businesses SET owner_id = $1 WHERE owner_id IS NULL RETURNING id', userId)).length,

    // Counts a request against a fixed window shared by every server instance. Returns false once over the limit.
    allow: async (key, limit, windowSeconds) => {
      const row = await one(`INSERT INTO rate_limits (key, count, reset_at) VALUES ($1, 1, now() + make_interval(secs => $2))
        ON CONFLICT (key) DO UPDATE SET
          count = CASE WHEN rate_limits.reset_at < now() THEN 1 ELSE rate_limits.count + 1 END,
          reset_at = CASE WHEN rate_limits.reset_at < now() THEN excluded.reset_at ELSE rate_limits.reset_at END
        RETURNING count`, key, windowSeconds);
      if (Math.random() < 0.01) await q("DELETE FROM rate_limits WHERE reset_at < now() - interval '1 day'");
      return row.count <= limit;
    },

    // Shops. Owner-scoped lists never include another account's shops.
    profile: async id => (await one('SELECT data FROM businesses WHERE id = $1', id))?.data,
    ownerOf: async id => { const row = await one('SELECT owner_id FROM businesses WHERE id = $1', id); return row ? row.owner_id : undefined; },
    profiles: async ownerId => (await q('SELECT data FROM businesses WHERE owner_id = $1 ORDER BY created_at, id', ownerId)).map(row => row.data),
    countProfiles: async ownerId => (await one('SELECT COUNT(*)::int AS n FROM businesses WHERE owner_id = $1', ownerId)).n,
    // Inserts a new shop only while the owner is under their plan limit; the check and the insert are one statement.
    createShop: async (profile, ownerId, limit) => (await q(`INSERT INTO businesses (id, owner_id, data) SELECT $1::text, $2::text, $3::jsonb WHERE (SELECT COUNT(*) FROM businesses WHERE owner_id = $2::text) < $4::int ON CONFLICT (id) DO NOTHING RETURNING id`, profile.id, ownerId, JSON.stringify(profile), limit)).length > 0,
    save: async (profile, ownerId) => {
      await q('INSERT INTO businesses (id, owner_id, data) VALUES ($1, $2, $3::jsonb) ON CONFLICT (id) DO UPDATE SET data = excluded.data, updated_at = now()', profile.id, ownerId ?? null, JSON.stringify(profile));
      return profile;
    },
    allShops: async () => (await q('SELECT id, owner_id, data FROM businesses ORDER BY created_at, id')).map(row => ({ id: row.id, name: row.data.name, published: row.data.published === true, ownerId: row.owner_id })),
    setOwner: async (id, ownerId) => (await q('UPDATE businesses SET owner_id = $1 WHERE id = $2 RETURNING id', ownerId, id)).length > 0,
    deleteProfile: async id => (await q('DELETE FROM businesses WHERE id = $1 RETURNING id', id)).length > 0,
    // Dashboard figures are totalled by the database, so the amount of feedback does not change how much is transferred.
    overview: async ownerId => {
      const zone = timeZone();
      const [shops, stats, daily, recent, totals, days] = await Promise.all([
        q('SELECT id FROM businesses WHERE owner_id = $1 ORDER BY created_at, id', ownerId),
        q(`SELECT f.business_id, COUNT(*)::int AS total, COUNT(*) FILTER (WHERE NOT f.read)::int AS unread, AVG(f.rating)::float AS average,
             COUNT(*) FILTER (WHERE f.rating = 1)::int AS r1, COUNT(*) FILTER (WHERE f.rating = 2)::int AS r2, COUNT(*) FILTER (WHERE f.rating = 3)::int AS r3,
             COUNT(*) FILTER (WHERE f.rating = 4)::int AS r4, COUNT(*) FILTER (WHERE f.rating = 5)::int AS r5, COUNT(*) FILTER (WHERE f.redirected_to_google)::int AS google
           FROM feedback f JOIN businesses b ON b.id = f.business_id WHERE b.owner_id = $1 GROUP BY f.business_id`, ownerId),
        q(`SELECT f.business_id, to_char(f.created_at AT TIME ZONE $2, 'YYYY-MM-DD') AS day, COUNT(*)::int AS n
           FROM feedback f JOIN businesses b ON b.id = f.business_id WHERE b.owner_id = $1 AND f.created_at > now() - make_interval(days => $3) GROUP BY 1, 2`, ownerId, zone, keepDays),
        q(`SELECT * FROM (SELECT f.*, ROW_NUMBER() OVER (PARTITION BY f.business_id ORDER BY f.created_at DESC) AS rn
             FROM feedback f JOIN businesses b ON b.id = f.business_id WHERE b.owner_id = $1) t WHERE rn <= 5 ORDER BY created_at DESC`, ownerId),
        q('SELECT t.* FROM visit_totals t JOIN businesses b ON b.id = t.business_id WHERE b.owner_id = $1', ownerId),
        q('SELECT d.* FROM visit_days d JOIN businesses b ON b.id = d.business_id WHERE b.owner_id = $1', ownerId),
      ]);
      return shops.map(({ id }) => {
        const total = totals.find(t => t.business_id === id);
        const visitDaily = Object.fromEntries(days.filter(d => d.business_id === id).map(d => [d.day, d.count]));
        const stat = stats.find(r => r.business_id === id);
        return {
          id,
          visits: total ? { count: total.count, lastVisited: iso(total.last_visited), daily: visitDaily } : { ...emptyVisits(), daily: visitDaily },
          feedback: {
            total: stat?.total || 0, unread: stat?.unread || 0, average: stat ? stat.average : null,
            distribution: stat ? [stat.r1, stat.r2, stat.r3, stat.r4, stat.r5] : [0, 0, 0, 0, 0], googleClicks: stat?.google || 0,
            daily: Object.fromEntries(daily.filter(r => r.business_id === id).map(r => [r.day, r.n])),
            recent: recent.filter(r => r.business_id === id).map(toFeedback),
          },
        };
      });
    },

    // QR visits
    visits,
    recordVisit: async id => {
      const now = new Date();
      await q('INSERT INTO visit_totals (business_id, count, last_visited) VALUES ($1, 1, $2) ON CONFLICT (business_id) DO UPDATE SET count = visit_totals.count + 1, last_visited = excluded.last_visited', id, now.toISOString());
      const today = await one('INSERT INTO visit_days (business_id, day, count) VALUES ($1, $2, 1) ON CONFLICT (business_id, day) DO UPDATE SET count = visit_days.count + 1 RETURNING count', id, dayKey(now));
      // Only the first scan of a day (when its row is created) trims old days.
      if (today.count === 1) await q('DELETE FROM visit_days WHERE business_id = $1 AND day <= $2', id, dayKey(new Date(now.getTime() - keepDays * 86400000)));
    },

    // Feedback
    feedback,
    addFeedback: async f => toFeedback(await one('INSERT INTO feedback (id, business_id, rating, note, selected_tags, redirected_to_google, status) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7) RETURNING *', randomUUID(), f.businessId, f.rating, f.note, JSON.stringify(f.selectedTags), f.redirectedToGoogle, f.status)),
    markFeedback: async (id, ids, read) => ids === 'all'
      ? (await q('UPDATE feedback SET read = $1 WHERE business_id = $2 AND read <> $1 RETURNING id', read, id)).length
      : (await q('UPDATE feedback SET read = $1 WHERE business_id = $2 AND id = ANY($3::text[]) AND read <> $1 RETURNING id', read, id, ids)).length,
    deleteFeedback: async (id, feedbackId) => (await q('DELETE FROM feedback WHERE business_id = $1 AND id = $2 RETURNING id', id, feedbackId)).length > 0,
    clearFeedback: async id => { await q('DELETE FROM feedback WHERE business_id = $1', id); },

    // One-time import of the old single-owner JSON store (npm run import-json). Imported shops have no owner until assigned.
    importLegacy: async ({ profiles = [], feedback: items = [], visits: legacyVisits = {} }) => {
      const ids = new Set();
      for (const profile of profiles) {
        if (!/^[a-z0-9-]{1,80}$/.test(profile?.id || '')) continue;
        const inserted = await q('INSERT INTO businesses (id, owner_id, data) VALUES ($1, NULL, $2::jsonb) ON CONFLICT (id) DO NOTHING RETURNING id', profile.id, JSON.stringify(profile));
        if (inserted.length) ids.add(profile.id);
      }
      for (const f of items) if (ids.has(f.businessId)) await q('INSERT INTO feedback (id, business_id, rating, note, selected_tags, redirected_to_google, status, read, created_at) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING', f.id || randomUUID(), f.businessId, f.rating, f.note || '', JSON.stringify(f.selectedTags || []), f.redirectedToGoogle === true, f.status || 'Private Feedback', f.read === true, f.timestamp || new Date().toISOString());
      for (const [id, v] of Object.entries(legacyVisits)) {
        if (!ids.has(id)) continue;
        await q('INSERT INTO visit_totals (business_id, count, last_visited) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', id, v.count || 0, v.lastVisited || null);
        for (const [day, count] of Object.entries(v.daily || {})) await q('INSERT INTO visit_days (business_id, day, count) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', id, day, count);
      }
      return ids.size;
    },
  };
}
