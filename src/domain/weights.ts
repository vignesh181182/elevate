// The actual weights available in the gym, grouped by equipment. Fed to the weight
// picker so a coach sets loads by tapping a real plate/bell/stack value instead of
// free-stepping arbitrary numbers. Edit these lists to match the gym's inventory.

export interface WeightGroup {
  label: string;
  options: number[]; // kg, ascending
}

export const WEIGHT_GROUPS: WeightGroup[] = [
  // 2 kg → 24 kg in 2 kg steps.
  { label: 'Kettlebell', options: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24] },
  // 1–5 kg singles, then the usual 2.5 kg ladder.
  { label: 'Dumbbell', options: [1, 2, 3, 4, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30] },
  // Loadable discs.
  { label: 'Weight plates', options: [1.25, 2.5, 5, 7.5, 10, 15, 20, 25] },
  // Selectorised machine stack (5 kg increments).
  { label: 'Machine', options: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100] },
];

/** Every distinct gym weight, ascending — the ladder the +/- steppers snap through. */
export const ALL_WEIGHTS: number[] = Array.from(new Set(WEIGHT_GROUPS.flatMap((g) => g.options))).sort(
  (a, b) => a - b,
);

const EPS = 1e-9;

/** The next gym weight above `w` (stays put once past the heaviest). */
export function nextWeight(w: number): number {
  return ALL_WEIGHTS.find((x) => x > w + EPS) ?? w;
}

/** The previous gym weight below `w` (floors at 0 = no weight). */
export function prevWeight(w: number): number {
  for (let i = ALL_WEIGHTS.length - 1; i >= 0; i--) if (ALL_WEIGHTS[i] < w - EPS) return ALL_WEIGHTS[i];
  return 0;
}
