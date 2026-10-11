export const dayKey = date => date.toLocaleDateString('en-CA');

// The last `count` calendar days as YYYY-MM-DD keys, oldest first, ending `offset` days ago.
export function lastDays(count, offset = 0) {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset - (count - 1 - index));
    return dayKey(date);
  });
}

export const sumDays = (daily = {}, keys) => keys.reduce((sum, key) => sum + (daily[key] || 0), 0);

export const compact = value => new Intl.NumberFormat(undefined, { notation: value >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value);

export const shortDate = key => new Date(`${key}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export function relativeTime(iso) {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  const format = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  for (const [unit, size] of [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]]) {
    if (Math.abs(seconds) >= size) return format.format(-Math.floor(seconds / size), unit);
  }
  return 'just now';
}
