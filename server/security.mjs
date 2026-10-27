// Headers for every response from the Node handlers. vercel.json repeats them for the static files Vercel serves directly.
// Images may come from any https host (owners paste image URLs) and fonts from Google, so those are the only open doors.
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https: http:; connect-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
};

// Where a QR code may send visitors: https only, no embedded credentials, and nothing that points back into a private network.
export function safeRedirect(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return false;
    if (/^\[?(::1?|fc|fd|fe80)/i.test(host)) return false;
    const octets = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)?.slice(1).map(Number);
    if (octets && (octets[0] === 10 || octets[0] === 127 || octets[0] === 0 || (octets[0] === 169 && octets[1] === 254) || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) || (octets[0] === 192 && octets[1] === 168))) return false;
    return true;
  } catch { return false; }
}

// Link-preview fetchers, crawlers and command-line tools do not count as a customer scanning a code.
export const looksAutomated = userAgent => !userAgent || /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|curl|wget|python-requests|httpclient|headless|monitor|uptime/i.test(userAgent);
