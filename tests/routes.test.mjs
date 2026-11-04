import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { APP_PATHS } from '../src/data/routes.js';

test('vercel.json sends exactly the app addresses to the app, so anything else is a real 404', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  const app = config.rewrites.find(item => item.destination === '/index.html');
  assert.ok(app, 'there is a rewrite to the app');
  // The source is "/(<regex>)": the part in brackets is a plain regular expression.
  const matches = path => new RegExp(`^${app.source}$`).test(path);
  for (const path of APP_PATHS.filter(path => path !== '/')) {
    assert.ok(matches(path), `${path} reaches the app`);
    assert.ok(matches(`${path}/`), `${path}/ reaches the app`);
  }
  for (const path of ['/nope-404', '/pricing/x', '/prices', '/demo/review', '/api/x', '/q/abc', '/assets/a.js']) assert.equal(matches(path), false, `${path} is not an app page`);
  assert.ok(config.rewrites.some(item => item.source === '/q/:id/google' && item.destination === '/api'), 'the per-shop Google review path reaches the API');
});

test('the API runs beside the database in Singapore, and versioned files are cached for a year', async () => {
  const vercel = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.deepEqual(vercel.regions, ['sin1']);
  const assets = vercel.headers.find(rule => rule.source === '/assets/(.*)');
  assert.equal(assets.headers.find(header => header.key === 'Cache-Control').value, 'public, max-age=31536000, immutable');
});
