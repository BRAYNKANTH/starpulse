import { isShortGoogleLink, placeFromGoogleText } from '../src/data/googlePlace.js';

// Google's own hosts only. The short link and the pages it redirects to are the whole chain; anything else is refused,
// so this endpoint cannot be used to make the server fetch arbitrary addresses.
const ALLOWED_HOSTS = new Set(['maps.app.goo.gl', 'goo.gl', 'www.google.com', 'google.com', 'maps.google.com']);
const MAX_HOPS = 5;

// Follows a Google Maps short link and returns the place found in the address it lands on, or null.
export async function resolveGoogleMapsLink(link, fetchImpl = fetch) {
  if (!isShortGoogleLink(link)) return null;
  let url = new URL(link.trim());
  for (let hop = 0; hop < MAX_HOPS; hop++) {
    if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) return null;
    const found = placeFromGoogleText(url.href);
    if (found) return found;
    const response = await fetchImpl(url.href, { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DQ.lk link check)' }, signal: AbortSignal.timeout(8000) });
    const next = response.headers.get('location');
    if (response.status < 300 || response.status >= 400 || !next) return null;
    url = new URL(next, url);
  }
  return null;
}
