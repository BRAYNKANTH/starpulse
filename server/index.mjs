import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { createStore } from './store.mjs';
import { createApi } from './api.mjs';
import { openDatabase } from './db.mjs';
import { SECURITY_HEADERS } from './security.mjs';

const root = resolve('dist');
const store = await createStore(await openDatabase());
const api = createApi(store, { trustProxy: process.env.TRUST_PROXY === 'true' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { await store.close(); process.exit(0); });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };
createServer((req, res) => api(req, res, () => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  let path;
  try { path = resolve(root, `.${decodeURIComponent(new URL(req.url, 'http://localhost').pathname)}`); } catch { res.writeHead(400); res.end(); return; }
  if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
  if (path === root || !existsSync(path)) path = resolve(root, 'index.html');
  res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', ...SECURITY_HEADERS });
  if (req.method === 'HEAD') res.end(); else createReadStream(path).on('error', () => res.destroy()).pipe(res);
})).listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => console.log(`DQ.lk running on port ${process.env.PORT || 3000}`));
