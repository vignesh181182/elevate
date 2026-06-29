// Muscle-group → tag palette tokens (ported from the prototype MUSCLE_COLORS).
// Drives the small colored group tag via CSS custom props (--c-bg / --c-fg).
export interface MuscleColor {
  c: string;
  b: string;
}

export const MUSCLE_COLORS: Record<string, MuscleColor> = {
  Quads: { c: 'var(--blue)', b: 'var(--blue-bg)' },
  Hamstrings: { c: 'var(--blue)', b: 'var(--blue-bg)' },
  Glutes: { c: 'var(--purple)', b: 'var(--purple-bg)' },
  Calves: { c: 'var(--blue)', b: 'var(--blue-bg)' },
  Chest: { c: 'var(--red)', b: 'var(--red-bg)' },
  Back: { c: 'var(--red)', b: 'var(--red-bg)' },
  Shoulders: { c: 'var(--amber)', b: 'var(--amber-bg)' },
  Biceps: { c: 'var(--amber)', b: 'var(--amber-bg)' },
  Triceps: { c: 'var(--amber)', b: 'var(--amber-bg)' },
  Core: { c: 'var(--green)', b: 'var(--green-bg)' },
  Cardio: { c: 'var(--accent)', b: 'var(--accent-soft)' },
  Mobility: { c: 'var(--muted)', b: 'var(--bg)' },
  Rehab: { c: 'var(--blue)', b: 'var(--blue-bg)' },
};

export function muscleColor(g: string): MuscleColor {
  return MUSCLE_COLORS[g] ?? { c: 'var(--muted)', b: 'var(--bg)' };
}

// 'All' first, then the 13 groups alphabetically — the filter-chip order.
export const LIB_GROUPS = [
  'All',
  'Back',
  'Biceps',
  'Calves',
  'Cardio',
  'Chest',
  'Core',
  'Glutes',
  'Hamstrings',
  'Mobility',
  'Quads',
  'Rehab',
  'Shoulders',
  'Triceps',
];
