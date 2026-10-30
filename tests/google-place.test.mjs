import test from 'node:test';
import assert from 'node:assert/strict';
import { isShortGoogleLink, placeFromGoogleText, placeIdFromFeatureId } from '../src/data/googlePlace.js';
import { resolveGoogleMapsLink } from '../server/googleLink.mjs';

const WATTALA_PLACE_ID = 'ChIJAzAcyndY4joRuKjmzPLJEt8';
const WATTALA_MAPS = 'https://www.google.com/maps/place/Al-maas+Indian+Restaurant+and+Reception+Hall+(Wattala)/@6.9873688,79.8881243,17z/data=!4m8!3m7!1s0x3ae25877ca1c3003:0xdf12c9f2cce6a8b8!8m2!3d6.9873688!4d79.8906992!9m1!1b1!16s%2Fg%2F11bw50c_0d?hl=en-LK&entry=ttu';

test('a Google Maps link becomes the place ID Google itself uses, and the review link', () => {
  assert.equal(placeIdFromFeatureId('3ae25877ca1c3003', 'df12c9f2cce6a8b8'), WATTALA_PLACE_ID);
  const found = placeFromGoogleText(WATTALA_MAPS);
  assert.equal(found.placeId, WATTALA_PLACE_ID);
  assert.equal(found.reviewUrl, `https://search.google.com/local/writereview?placeid=${WATTALA_PLACE_ID}`);
  assert.equal(placeFromGoogleText(WATTALA_MAPS.replace('0x3ae25877ca1c3003:0xdf', '0x3ae25877ca1c3003%3A0xdf')).placeId, WATTALA_PLACE_ID, 'an encoded colon still works');
});

test('a pasted Place ID, or a link that carries one, is used as it is', () => {
  assert.equal(placeFromGoogleText(` ${WATTALA_PLACE_ID} `).placeId, WATTALA_PLACE_ID);
  assert.equal(placeFromGoogleText(`https://www.google.com/maps/place/?q=place_id:${WATTALA_PLACE_ID}`).placeId, WATTALA_PLACE_ID);
  assert.equal(placeFromGoogleText(`https://search.google.com/local/writereview?placeid=${WATTALA_PLACE_ID}`).placeId, WATTALA_PLACE_ID);
});

test('text with no place in it gives nothing', () => {
  for (const text of ['', '   ', 'hello', 'https://example.com', 'https://maps.app.goo.gl/abc', 'ChIJ short', 42, null]) assert.equal(placeFromGoogleText(text), null, String(text));
});

test('only Google Maps short links are followed, and only through Google hosts', async () => {
  assert.ok(isShortGoogleLink('https://maps.app.goo.gl/AbC123'));
  assert.ok(isShortGoogleLink('https://goo.gl/maps/AbC123'));
  for (const bad of ['http://maps.app.goo.gl/x', 'https://evil.example/maps.app.goo.gl', 'https://goo.gl/other', 'nope']) assert.equal(isShortGoogleLink(bad), false, bad);

  const calls = [];
  const redirect = location => async url => { calls.push(url); return { status: 302, headers: new Headers({ location }) }; };
  assert.equal((await resolveGoogleMapsLink('https://maps.app.goo.gl/AbC123', redirect(WATTALA_MAPS))).placeId, WATTALA_PLACE_ID);
  assert.deepEqual(calls, ['https://maps.app.goo.gl/AbC123'], 'one hop was enough');

  calls.length = 0;
  assert.equal(await resolveGoogleMapsLink('https://maps.app.goo.gl/AbC123', redirect('https://169.254.169.254/latest')), null, 'a redirect off Google is not followed');
  assert.equal(calls.length, 1, 'and nothing past the first Google hop is fetched');
  assert.equal(await resolveGoogleMapsLink('https://maps.app.goo.gl/AbC123', async () => ({ status: 200, headers: new Headers() })), null);
  assert.equal(await resolveGoogleMapsLink('https://example.com/x', redirect(WATTALA_MAPS)), null, 'not a short link, never fetched');
});
