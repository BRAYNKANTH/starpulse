// crypto.randomUUID only exists in secure contexts (HTTPS or localhost), so fall back elsewhere.
export const newId = () => crypto.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// Shop IDs appear in printed QR links (/q/<id>), so they are short: 10 characters without look-alikes (~50 bits).
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
export function newShopId() {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return [...bytes].map(b => ALPHABET[b % ALPHABET.length]).join('');
}
