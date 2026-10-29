// Google review form for Al-maas Indian Restaurant and Reception Hall (Wattala). The place ID comes from the listing id in
// its Google Maps link (0x3ae25877ca1c3003:0xdf12c9f2cce6a8b8). The printed review card scans to DEMO_REVIEW_PATH on our own site, which redirects
// here, so a wrong place ID can be corrected later without reprinting the cards.
// The same address is in vercel.json (redirects); tests/demo-review.test.mjs keeps the two in step.
export const DEMO_GOOGLE_PLACE_ID = 'ChIJAzAcyndY4joRuKjmzPLJEt8';
export const DEMO_GOOGLE_REVIEW_URL = `https://search.google.com/local/writereview?placeid=${DEMO_GOOGLE_PLACE_ID}`;
export const DEMO_REVIEW_PATH = '/demo/review';
