// A currency is shown the way people in its home country write it, whatever country the owner or visitor is in.
const LOCALES = { LKR: 'en-LK', USD: 'en-US', GBP: 'en-GB', EUR: 'en-IE', INR: 'en-IN', AUD: 'en-AU', CAD: 'en-CA', NZD: 'en-NZ', SGD: 'en-SG', MYR: 'en-MY', AED: 'en-AE', JPY: 'ja-JP' };

export function formatMoney(value, currency = 'LKR', style = 'currency') {
  const amount = Number(value) || 0;
  const locale = LOCALES[currency] || 'en';
  try {
    const full = new Intl.NumberFormat(locale, { style: 'currency', currency });
    if (style === 'currency') return full.format(amount);
    // Plain numbers keep the currency's own decimals: two for most, none for yen.
    const { minimumFractionDigits, maximumFractionDigits } = full.resolvedOptions();
    return new Intl.NumberFormat(locale, { minimumFractionDigits, maximumFractionDigits }).format(amount);
  } catch { return `${currency} ${amount.toFixed(2)}`; }
}
