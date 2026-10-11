// Vercel Function: every /api/* and /q/* request is rewritten here (see vercel.json); req.url keeps the original path.
import { createApi } from '../server/api.mjs';
import { createStore } from '../server/store.mjs';
import { neonDatabase } from '../server/neon.mjs';

let handler;
const getHandler = () => {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error('DATABASE_URL is not set. Connect a Neon database to this Vercel project.');
  // Created once per warm instance; retried on the next request if setup failed.
  handler ??= neonDatabase(url).then(createStore).then(store => createApi(store, { trustProxy: true })).catch(error => { handler = undefined; throw error; });
  return handler;
};

export default async function (req, res) {
  try {
    const api = await getHandler();
    await api(req, res, () => { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Not found.' })); });
  } catch (error) {
    console.error(error);
    if (!res.headersSent) { res.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify({ error: 'The service is starting up or unavailable. Try again shortly.' })); }
  }
}
