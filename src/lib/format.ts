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

/** Program date range, e.g. "3 Feb – 15 Mar 2025"; "from …"/"ended …" when one-sided. */
export function fmtProgRange(startISO?: string, endISO?: string): string {
  const a = startISO ? new Date(startISO + 'T00:00:00') : null;
  const b = endISO ? new Date(endISO + 'T00:00:00') : null;
  const aOk = a && !isNaN(+a);
  const bOk = b && !isNaN(+b);
  const sameYear = aOk && bOk && a!.getFullYear() === b!.getFullYear();
  const fmt = (d: Date, yr: boolean) =>
    d.toLocaleDateString('en-GB', yr ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' });
  if (aOk && bOk) return `${fmt(a!, !sameYear)} – ${fmt(b!, true)}`;
  if (bOk) return `ended ${fmt(b!, true)}`;
  if (aOk) return `from ${fmt(a!, true)}`;
  return '—';
}

/** Relative day label, e.g. "Today", "Yesterday", "3 days ago". */
export function relativeDay(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(+d)) return iso;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return fmtShortDate(iso);
}

/** "17:30" (24h, from <input type=time>) → "5:30 PM" — the app's stored time format. */
export function to12h(hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
  if (!m) return '';
  let h = +m[1];
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m[2]} ${ap}`;
}

/** "5:30 PM" → "17:30" — to pre-fill an <input type=time> when editing. */
export function to24h(t12: string): string {
  const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(t12 || '');
  if (!m) return '';
  let h = +m[1] % 12;
  if (/pm/i.test(m[3])) h += 12;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}
