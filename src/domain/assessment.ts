// Pure assessment logic + constants ported from the prototype. No Firebase, no React.
// The first-assessment captures baseline measurements, 1–5 performance ratings, a
// client profile, and notes. Money-decoupled: no fee gate (the fee is a separate
// payment), so this module is purely about the training-baseline data.
import type { Client } from './types';

/** The five rated movement-quality dimensions (key + label + emoji). */
export const ASSESS_DIMS = [
  { k: 'strength', label: 'Strength', ic: '💪' },
  { k: 'flexibility', label: 'Flexibility', ic: '🤸' },
  { k: 'mobility', label: 'Mobility', ic: '🦵' },
  { k: 'endurance', label: 'Endurance', ic: '🫀' },
  { k: 'balance', label: 'Balance & posture', ic: '🧘' },
] as const;

/** Word for a 1–5 rating (index 0 = unrated). */
export const RATE_WORDS = ['', 'Needs work', 'Below avg', 'Average', 'Good', 'Excellent'] as const;

/** Profile chip groups feeding the assessment summary (single-select, except focusAreas). */
export const ASSESS_PROFILE = {
  bodyType: { label: 'Body type', ic: '🧍', multi: false, opts: ['Ectomorph', 'Mesomorph', 'Endomorph'] },
  fitnessLevel: { label: 'Fitness level', ic: '📈', multi: false, opts: ['Beginner', 'Intermediate', 'Advanced'] },
  primaryGoal: {
    label: 'Primary goal',
    ic: '🎯',
    multi: false,
    opts: ['Muscle gain', 'Fat loss', 'Endurance', 'Mobility', 'General fitness'],
  },
  focusAreas: {
    label: 'Focus areas',
    ic: '🏋️',
    multi: true,
    opts: ['Strength', 'Hypertrophy', 'Endurance', 'Mobility', 'Cardio', 'Posture'],
  },
} as const;

/** The word label for a rating value (safe for out-of-range / 0). */
export function rateWord(n: number | undefined): string {
  return n && n >= 1 && n <= 5 ? RATE_WORDS[n] : '—';
}

/** Whether a completed assessment exists. */
export function hasAssessment(c: Pick<Client, 'assessment'>): boolean {
  return !!c.assessment;
}

/**
 * Seed the Weight/Waist measurement series from an assessment baseline WITHOUT
 * clobbering existing history: a series is only started when it's currently empty.
 * Returns the full new measures map to write.
 */
export function mergeBaselineMeasures(
  existing: Record<string, number[]> | undefined,
  baseline: { weight?: number; waist?: number },
): Record<string, number[]> {
  const out: Record<string, number[]> = { ...(existing ?? {}) };
  if (baseline.weight && !out.Weight?.length) out.Weight = [baseline.weight];
  if (baseline.waist && !out.Waist?.length) out.Waist = [baseline.waist];
  return out;
}
