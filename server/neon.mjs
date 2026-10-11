// Neon serverless Postgres over HTTP: one statement per request, no connection to keep open between invocations.
import { neon } from '@neondatabase/serverless';

export async function neonDatabase(url) {
  const sql = neon(url);
  return { query: (text, params = []) => sql.query(text, params), close: async () => {} };
}
