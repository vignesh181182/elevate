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
