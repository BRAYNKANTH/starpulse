// Al Maas's Google review form. The printed review card scans to DEMO_REVIEW_PATH on our own site, which redirects
// here, so a wrong place ID can be corrected later without reprinting the cards.
// The same address is in vercel.json (redirects); tests/demo-review.test.mjs keeps the two in step.
export const DEMO_GOOGLE_PLACE_ID = 'ChIJ4X70MNn34joRjj4MMh0RQ0s';
export const DEMO_GOOGLE_REVIEW_URL = `https://search.google.com/local/writereview?placeid=${DEMO_GOOGLE_PLACE_ID}`;
export const DEMO_REVIEW_PATH = '/demo/review';
