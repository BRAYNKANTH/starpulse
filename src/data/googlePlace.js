// Builds a Google review link from whatever an owner can copy from Google: a Maps link, or a Place ID.
// Shared by the studio and the server, so it uses no Node-only APIs.

const REVIEW_BASE = 'https://search.google.com/local/writereview?placeid=';
const PLACE_ID = /(?:^|[^A-Za-z0-9_-])(ChIJ[A-Za-z0-9_-]{20,40})(?![A-Za-z0-9_-])/;
// Every Maps listing carries its id as "0x<hex>:0x<hex>" (for example in "!1s0x3ae25877ca1c3003:0xdf12c9f2cce6a8b8").
const FEATURE_ID = /0x([0-9a-f]{1,16}):0x([0-9a-f]{1,16})/i;

const base64Url = bytes => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
const littleEndian = hex => { let n = BigInt(`0x${hex}`); return Array.from({ length: 8 }, () => { const byte = Number(n & 0xffn); n >>= 8n; return byte; }); };

// A place ID is that listing id written out the way Google's own "ChIJ…" IDs are: a small protobuf, base64url.
export function placeIdFromFeatureId(first, second) {
  return base64Url([0x0a, 0x12, 0x09, ...littleEndian(first), 0x11, ...littleEndian(second)]);
}

export const reviewLinkForPlaceId = placeId => `${REVIEW_BASE}${encodeURIComponent(placeId)}`;

// Accepts a pasted Place ID, a Maps link (long form), or a link carrying place_id= or placeid=. Returns null when nothing usable is found.
export function placeFromGoogleText(text) {
  if (typeof text !== 'string') return null;
  let value = text.trim();
  if (!value || value.length > 4000) return null;
  try { value = decodeURIComponent(value); } catch { /* keep the text as pasted */ }
  const direct = value.match(PLACE_ID);
  if (direct) return { placeId: direct[1], reviewUrl: reviewLinkForPlaceId(direct[1]) };
  const feature = value.match(FEATURE_ID);
  if (feature) {
    const placeId = placeIdFromFeatureId(feature[1], feature[2]);
    return { placeId, reviewUrl: reviewLinkForPlaceId(placeId) };
  }
  return null;
}

// Short links the Share button gives out. They only redirect to the long form, so the server follows them (see server/googleLink.mjs).
export const isShortGoogleLink = value => {
  try { const url = new URL(value.trim()); return url.protocol === 'https:' && (url.hostname === 'maps.app.goo.gl' || (url.hostname === 'goo.gl' && url.pathname.startsWith('/maps'))); } catch { return false; }
};
