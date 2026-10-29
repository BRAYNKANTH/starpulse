import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DEMO_GOOGLE_REVIEW_URL, DEMO_REVIEW_PATH } from '../src/data/demoReview.js';

test('the demo review card redirect in vercel.json matches the shared review link', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  const redirect = config.redirects.find(item => item.source === DEMO_REVIEW_PATH);
  assert.ok(redirect, 'vercel.json has a redirect for the review card path');
  assert.equal(redirect.destination, DEMO_GOOGLE_REVIEW_URL);
  assert.equal(redirect.permanent, false, 'temporary, so the link can change');
});
