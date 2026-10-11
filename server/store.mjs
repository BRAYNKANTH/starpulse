import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { normalizeQrDesign } from '../src/data/qrDesign.js';
import { normalizeMenuDesign } from '../src/data/menuDesign.js';
import { normalizeMenuTags } from '../src/data/menuTags.js';

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
  const menu = Array.isArray(input.menu) ? input.menu.slice(0, 200).map(item => {
    if (!item || typeof item !== 'object') throw new Error('Invalid menu item.');
    const price = Number(item.price);
    if (!['number', 'string'].includes(typeof item.price) || String(item.price).trim() === '' || !text(item.name, 150) || !Number.isFinite(price) || price < 0 || price > 10000000) throw new Error('Each menu item needs a name and a valid non-negative price.');
    return { id: text(item.id, 80) || randomUUID(), name: text(item.name, 150), category: text(item.category, 80) || 'Menu', description: text(item.description), price, image: url(item.image, true), available: item.available !== false, soldOut: item.soldOut === true, tags: normalizeMenuTags(item.tags) };
  }) : [];
  return { id, name, tagline: text(input.tagline), category: text(input.category, 80), address: text(input.address), phone: text(input.phone, 80), email: text(input.email, 150), hours: text(input.hours), logo: url(input.logo, true), coverImage: url(input.coverImage, true), googleReviewUrl: url(input.googleReviewUrl), googlePlaceId: text(input.googlePlaceId, 200), accentColor: /^#[0-9a-f]{6}$/i.test(input.accentColor) ? input.accentColor : '#F59E0B', customPrompt: text(input.customPrompt), notePlaceholder: text(input.notePlaceholder), quickTags: Array.isArray(input.quickTags) ? input.quickTags.filter(t => typeof t === 'string').slice(0, 20).map(t => text(t, 80)) : [], currency: /^[A-Z]{3}$/.test(input.currency) ? input.currency : 'LKR', menu, menuDesign: normalizeMenuDesign(input.menuDesign), qrDesign: normalizeQrDesign(input.qrDesign), qrDestination: ['landing', 'menu', 'review', 'url'].includes(input.qrDestination) ? input.qrDestination : 'landing', qrUrl: url(input.qrUrl), published: input.published === true, themeMode: 'dark' };
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE, name TEXT NOT NULL,
    password_hash TEXT NOT NULL, plan TEXT NOT NULL DEFAULT 'free', created_at TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'owner', must_change_password INTEGER NOT NULL DEFAULT 0);
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL);
  CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
  CREATE TABLE IF NOT EXISTS businesses (
    id TEXT PRIMARY KEY, owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    data TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS businesses_owner ON businesses(owner_id);
  CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL, note TEXT NOT NULL, selected_tags TEXT NOT NULL, redirected_to_google INTEGER NOT NULL,
    status TEXT NOT NULL, read INTEGER NOT NULL DEFAULT 0, timestamp TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS feedback_business ON feedback(business_id, timestamp DESC);
  CREATE TABLE IF NOT EXISTS visit_totals (
    business_id TEXT PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE, count INTEGER NOT NULL, last_visited TEXT);
  CREATE TABLE IF NOT EXISTS visit_days (
    business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE, day TEXT NOT NULL, count INTEGER NOT NULL,
    PRIMARY KEY (business_id, day));
`;

const keepDays = 120;
const dayKey = date => date.toLocaleDateString('en-CA'); // YYYY-MM-DD in the server's time zone (set TZ to choose it)
const toFeedback = row => ({ id: row.id, businessId: row.business_id, rating: row.rating, note: row.note, selectedTags: JSON.parse(row.selected_tags), redirectedToGoogle: row.redirected_to_google === 1, status: row.status, read: row.read === 1, timestamp: row.timestamp });
const toUser = row => row && { id: row.id, email: row.email, name: row.name, plan: row.plan, role: row.role, mustChangePassword: row.must_change_password === 1, createdAt: row.created_at };

export function createStore(directory) {
  mkdirSync(directory, { recursive: true });
  const db = new DatabaseSync(join(directory, 'starpulse.db'));
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  db.exec(SCHEMA);
  // Columns added after the first database release.
  const userColumns = db.prepare('PRAGMA table_info(users)').all().map(c => c.name);
  if (!userColumns.includes('role')) db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'owner'");
  if (!userColumns.includes('must_change_password')) db.exec('ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0');
  const q = sql => db.prepare(sql);
  const tx = fn => { db.exec('BEGIN IMMEDIATE'); try { const result = fn(); db.exec('COMMIT'); return result; } catch (error) { db.exec('ROLLBACK'); throw error; } };

  // One-time import of the old single-owner JSON store. Imported shops have no owner until claimed (npm run claim-shops).
  const legacyFile = join(directory, 'store.json');
  if (existsSync(legacyFile) && !q("SELECT 1 FROM meta WHERE key = 'legacy_imported'").get()) {
    const legacy = JSON.parse(readFileSync(legacyFile, 'utf8'));
    const legacyVisitsFile = join(directory, 'visits.json');
    const legacyVisits = existsSync(legacyVisitsFile) ? JSON.parse(readFileSync(legacyVisitsFile, 'utf8')) : legacy.visits || {};
    if (!Array.isArray(legacy.profiles) || !Array.isArray(legacy.feedback)) throw new Error('Invalid legacy store.json. Restore your data backup before starting.');
    tx(() => {
      const now = new Date().toISOString();
      const ids = new Set();
      for (const profile of legacy.profiles) {
        if (!/^[a-z0-9-]{1,80}$/.test(profile?.id || '')) continue;
        q('INSERT OR IGNORE INTO businesses (id, owner_id, data, created_at, updated_at) VALUES (?, NULL, ?, ?, ?)').run(profile.id, JSON.stringify(profile), now, now);
        ids.add(profile.id);
      }
      for (const f of legacy.feedback) if (ids.has(f.businessId)) q('INSERT OR IGNORE INTO feedback (id, business_id, rating, note, selected_tags, redirected_to_google, status, read, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(f.id || randomUUID(), f.businessId, f.rating, f.note || '', JSON.stringify(f.selectedTags || []), f.redirectedToGoogle ? 1 : 0, f.status || 'Private Feedback', f.read ? 1 : 0, f.timestamp || now);
      for (const [id, v] of Object.entries(legacyVisits)) {
        if (!ids.has(id)) continue;
        q('INSERT OR IGNORE INTO visit_totals (business_id, count, last_visited) VALUES (?, ?, ?)').run(id, v.count || 0, v.lastVisited || null);
        for (const [day, count] of Object.entries(v.daily || {})) q('INSERT OR IGNORE INTO visit_days (business_id, day, count) VALUES (?, ?, ?)').run(id, day, count);
      }
      q("INSERT INTO meta (key, value) VALUES ('legacy_imported', ?)").run(now);
    });
  }

  const readProfile = row => row && JSON.parse(row.data);
  const visits = id => {
    const total = q('SELECT count, last_visited FROM visit_totals WHERE business_id = ?').get(id);
    const daily = Object.fromEntries(q('SELECT day, count FROM visit_days WHERE business_id = ?').all(id).map(r => [r.day, r.count]));
    return { count: total?.count || 0, lastVisited: total?.last_visited || null, daily };
  };
  const feedback = id => q('SELECT * FROM feedback WHERE business_id = ? ORDER BY timestamp DESC').all(id).map(toFeedback);
  const summary = id => {
    const items = feedback(id);
    const distribution = [1, 2, 3, 4, 5].map(rating => items.filter(f => f.rating === rating).length);
    const daily = {};
    for (const item of items) { const key = dayKey(new Date(item.timestamp)); daily[key] = (daily[key] || 0) + 1; }
    return { total: items.length, unread: items.filter(f => !f.read).length, average: items.length ? items.reduce((sum, f) => sum + f.rating, 0) / items.length : null, distribution, googleClicks: items.filter(f => f.redirectedToGoogle).length, daily, recent: items.slice(0, 5) };
  };

  return {
    close: () => db.close(),

    // Accounts and sessions
    createUser: ({ email, name, passwordHash, plan = 'free', role = 'owner', mustChangePassword = false }) => {
      const id = randomUUID();
      try { q('INSERT INTO users (id, email, name, password_hash, plan, role, must_change_password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(id, email, name, passwordHash, plan, role, mustChangePassword ? 1 : 0, new Date().toISOString()); }
      catch (error) { if (/UNIQUE/.test(error.message)) throw Object.assign(new Error('An account with this email already exists.'), { status: 409 }); throw error; }
      return toUser(q('SELECT * FROM users WHERE id = ?').get(id));
    },
    users: () => q('SELECT users.*, (SELECT COUNT(*) FROM businesses WHERE owner_id = users.id) AS shops FROM users ORDER BY created_at').all().map(row => ({ ...toUser(row), shops: row.shops })),
    user: id => toUser(q('SELECT * FROM users WHERE id = ?').get(id)),
    userByEmail: email => toUser(q('SELECT * FROM users WHERE email = ?').get(email)),
    passwordHash: id => q('SELECT password_hash FROM users WHERE id = ?').get(id)?.password_hash,
    updateUser: (id, changes) => {
      const columns = { name: 'name', passwordHash: 'password_hash', plan: 'plan', role: 'role', mustChangePassword: 'must_change_password' };
      for (const [key, column] of Object.entries(columns)) if (changes[key] !== undefined) q(`UPDATE users SET ${column} = ? WHERE id = ?`).run(typeof changes[key] === 'boolean' ? Number(changes[key]) : changes[key], id);
      return toUser(q('SELECT * FROM users WHERE id = ?').get(id));
    },
    deleteUser: id => q('DELETE FROM users WHERE id = ?').run(id).changes > 0,
    createSession: (tokenHash, userId, expiresAt) => {
      const now = Date.now();
      q('DELETE FROM sessions WHERE expires_at < ?').run(now);
      q('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').run(tokenHash, userId, expiresAt, now);
    },
    sessionUser: tokenHash => toUser(q('SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE token_hash = ? AND expires_at > ?').get(tokenHash, Date.now())),
    deleteSession: tokenHash => { q('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash); },
    deleteOtherSessions: (userId, keepHash) => { q('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').run(userId, keepHash); },
    deleteSessions: userId => { q('DELETE FROM sessions WHERE user_id = ?').run(userId); },
    claimUnowned: userId => Number(q('UPDATE businesses SET owner_id = ? WHERE owner_id IS NULL').run(userId).changes),

    // Shops. Owner-scoped lists never include another account's shops.
    profile: id => readProfile(q('SELECT data FROM businesses WHERE id = ?').get(id)),
    ownerOf: id => { const row = q('SELECT owner_id FROM businesses WHERE id = ?').get(id); return row ? row.owner_id : undefined; },
    profiles: ownerId => q('SELECT data FROM businesses WHERE owner_id = ? ORDER BY created_at, id').all(ownerId).map(readProfile),
    countProfiles: ownerId => q('SELECT COUNT(*) AS n FROM businesses WHERE owner_id = ?').get(ownerId).n,
    save: (profile, ownerId) => {
      const now = new Date().toISOString();
      q('INSERT INTO businesses (id, owner_id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at').run(profile.id, ownerId, JSON.stringify(profile), now, now);
      return profile;
    },
    allShops: () => q('SELECT id, owner_id, data FROM businesses ORDER BY created_at, id').all().map(row => { const data = JSON.parse(row.data); return { id: row.id, name: data.name, published: data.published === true, ownerId: row.owner_id }; }),
    setOwner: (id, ownerId) => q('UPDATE businesses SET owner_id = ? WHERE id = ?').run(ownerId, id).changes > 0,
    deleteProfile: id => q('DELETE FROM businesses WHERE id = ?').run(id).changes > 0,
    overview: ownerId => q('SELECT id FROM businesses WHERE owner_id = ? ORDER BY created_at, id').all(ownerId).map(({ id }) => ({ id, visits: visits(id), feedback: summary(id) })),

    // QR visits
    visits,
    recordVisit: id => {
      const now = new Date();
      tx(() => {
        q('INSERT INTO visit_totals (business_id, count, last_visited) VALUES (?, 1, ?) ON CONFLICT(business_id) DO UPDATE SET count = count + 1, last_visited = excluded.last_visited').run(id, now.toISOString());
        q('INSERT INTO visit_days (business_id, day, count) VALUES (?, ?, 1) ON CONFLICT(business_id, day) DO UPDATE SET count = count + 1').run(id, dayKey(now));
        q('DELETE FROM visit_days WHERE business_id = ? AND day <= ?').run(id, dayKey(new Date(now.getTime() - keepDays * 86400000)));
      });
    },

    // Feedback
    feedback,
    addFeedback: f => {
      const item = { ...f, id: randomUUID(), timestamp: new Date().toISOString(), read: false };
      q('INSERT INTO feedback (id, business_id, rating, note, selected_tags, redirected_to_google, status, read, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)').run(item.id, item.businessId, item.rating, item.note, JSON.stringify(item.selectedTags), item.redirectedToGoogle ? 1 : 0, item.status, item.timestamp);
      return item;
    },
    markFeedback: (id, ids, read) => {
      const value = read ? 1 : 0;
      if (ids === 'all') return Number(q('UPDATE feedback SET read = ? WHERE business_id = ? AND read != ?').run(value, id, value).changes);
      const update = q('UPDATE feedback SET read = ? WHERE business_id = ? AND id = ? AND read != ?');
      return tx(() => ids.reduce((changed, feedbackId) => changed + Number(update.run(value, id, feedbackId, value).changes), 0));
    },
    deleteFeedback: (id, feedbackId) => q('DELETE FROM feedback WHERE business_id = ? AND id = ?').run(id, feedbackId).changes > 0,
    clearFeedback: id => { q('DELETE FROM feedback WHERE business_id = ?').run(id); },
  };
}
