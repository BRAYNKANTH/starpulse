import { menuTagLabel } from './menuTags.js';

// A dish matches when every word typed appears somewhere in it, in any order. Phone keyboards often add a space after
// a word, so spacing is ignored.
export function matchesMenuSearch(item, query) {
  const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = [item.name, item.description, item.category, ...(item.tags || []).map(menuTagLabel)].filter(Boolean).join(' ').toLowerCase();
  return words.every(word => text.includes(word));
}
