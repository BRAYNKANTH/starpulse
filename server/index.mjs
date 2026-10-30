import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { createStore } from './store.mjs';
import { createApi } from './api.mjs';
import { openDatabase } from './db.mjs';
import { SECURITY_HEADERS } from './security.mjs';
import { DEMO_GOOGLE_REVIEW_URL, DEMO_REVIEW_PATH } from '../src/data/demoReview.js';
import { APP_PATHS } from '../src/data/routes.js';

const root = resolve('dist');
const store = await createStore(await openDatabase());
const api = createApi(store, { trustProxy: process.env.TRUST_PROXY === 'true' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { await store.close(); process.exit(0); });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };
createServer((req, res) => api(req, res, () => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  // The Al Maas review card scans to this path, which sends the customer straight to Google's review form.
  if (new URL(req.url, 'http://localhost').pathname === DEMO_REVIEW_PATH) { res.writeHead(302, { Location: DEMO_GOOGLE_REVIEW_URL, 'Cache-Control': 'no-store', ...SECURITY_HEADERS }); res.end(); return; }
  let path;
  try { path = resolve(root, `.${decodeURIComponent(new URL(req.url, 'http://localhost').pathname)}`); } catch { res.writeHead(400); res.end(); return; }
  if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
  // The app answers only its own addresses (src/data/routes.js). Anything else gets a real 404, with the app's "page not found" screen for pages.
  const pathname = new URL(req.url, 'http://localhost').pathname.replace(/\/+$/, '') || '/';
  let status = 200;
  if (path === root || !existsSync(path)) {
    if (extname(pathname)) { res.writeHead(404, SECURITY_HEADERS); res.end(); return; }
    if (!APP_PATHS.includes(pathname)) status = 404;
    path = resolve(root, 'index.html');
  }
  const demo = /^\/demo(\/|$)/.test(new URL(req.url, 'http://localhost').pathname);
  res.writeHead(status, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', ...SECURITY_HEADERS, ...(demo ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}) });
  if (req.method === 'HEAD') res.end(); else createReadStream(path).on('error', () => res.destroy()).pipe(res);
})).listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => console.log(`DQ.lk running on port ${process.env.PORT || 3000}`));
