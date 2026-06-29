// Client category → palette tokens + icon (ported from the prototype CATS map).
// Drives the category-tinted avatar via CSS custom props (--c-bg / --c-fg).
export interface CategoryStyle {
  c: string;
  b: string;
  ic: string;
}

export const CATS: Record<string, CategoryStyle> = {
  'General wellness': { c: 'var(--green)', b: 'var(--green-bg)', ic: '🌿' },
  Rehab: { c: 'var(--blue)', b: 'var(--blue-bg)', ic: '🩹' },
  'Special children': { c: 'var(--purple)', b: 'var(--purple-bg)', ic: '⭐' },
  'Sports specific': { c: 'var(--amber)', b: 'var(--amber-bg)', ic: '🏆' },
};

const FALLBACK: CategoryStyle = { c: 'var(--muted)', b: 'var(--bg)', ic: '•' };

export function catStyle(cat: string): CategoryStyle {
  return CATS[cat] ?? FALLBACK;
}
