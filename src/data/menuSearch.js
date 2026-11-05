import { menuTagLabel } from './menuTags.js';

const searchWords = query => String(query || '').toLowerCase().split(/\s+/).filter(Boolean);

// A dish matches when every word typed appears somewhere in it, in any order. Phone keyboards often add a space after
// a word, so spacing is ignored.
export function matchesMenuSearch(item, query) {
  const words = searchWords(query);
  if (!words.length) return true;
  const text = [item.name, item.description, item.category, ...(item.tags || []).map(menuTagLabel)].filter(Boolean).join(' ').toLowerCase();
  return words.every(word => text.includes(word));
}

// Splits text into plain and matched pieces, so the letters a customer typed can be highlighted. Every piece keeps the
// text's own spelling and capitals, and matches that touch or overlap become one piece.
export function highlightParts(text, query) {
  const source = String(text ?? '');
  const lower = source.toLowerCase();
  const words = searchWords(query);
  // A few characters change length in lower case, which would put the highlight on the wrong letters.
  if (!words.length || lower.length !== source.length) return source ? [{ text: source, match: false }] : [];
  const marked = new Array(source.length).fill(false);
  for (const word of words) {
    for (let at = lower.indexOf(word); at !== -1; at = lower.indexOf(word, at + 1)) marked.fill(true, at, at + word.length);
  }
  const parts = [];
  for (let i = 0; i < source.length; i += 1) {
    const last = parts[parts.length - 1];
    if (last?.match === marked[i]) last.text += source[i];
    else parts.push({ text: source[i], match: marked[i] });
  }
  return parts;
}
