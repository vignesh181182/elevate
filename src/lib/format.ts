// Small shared formatters ported from the prototype.

/** Initials from a name, e.g. "Madhan Kumar" → "MK" (max 2 chars). */
export function initials(name?: string): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/** YYYY-MM-DD → "3 Feb 2025" (falls back to the raw string if unparseable). */
export function fmtPayDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return isNaN(+d) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** YYYY-MM-DD → "3 Feb" (no year). */
export function fmtShortDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return isNaN(+d) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
