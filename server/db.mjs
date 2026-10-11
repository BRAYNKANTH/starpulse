// Database connections. Each returns { query(text, params) → rows, close() }.
// With DATABASE_URL (Vercel + Neon) the app uses Neon; without it, an embedded Postgres (PGlite) for local use.
import { resolve } from 'node:path';

export { neonDatabase } from './neon.mjs';

// Pass a directory to keep data between runs, or nothing for an in-memory database (tests).
export async function localDatabase(directory) {
  const { PGlite } = await import('@electric-sql/pglite');
  const db = new PGlite(directory);
  await db.waitReady;
  return { query: async (text, params = []) => (await db.query(text, params)).rows, close: () => db.close() };
}

export async function openDatabase() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) return (await import('./neon.mjs')).neonDatabase(url);
  return localDatabase(resolve(process.env.DATA_DIR || '.data', 'pglite'));
}
