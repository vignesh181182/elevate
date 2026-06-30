// Pure per-day A/B program helpers. The standing program is planned per training
// day with two slots (Program A / Program B); each exercise is tagged with `day` +
// `prog`. These helpers group/filter that flat list — no Firebase, no React.
import type { Client, ProgramExercise } from './types';
import { parseDays } from './client';

export type ProgLabel = 'A' | 'B';
export const PROG_LABELS: ProgLabel[] = ['A', 'B'];

/** A real, plannable exercise (excludes future rows + the "Tap to add" placeholder). */
export function isPlannable(e: ProgramExercise): boolean {
  return !e.future && e.name !== 'Tap to add exercise';
}

/** Exercises assigned to one (day, A/B) slot, in display order. */
export function exForDayProg(exercises: ProgramExercise[], day: string, prog: ProgLabel): ProgramExercise[] {
  return exercises
    .filter((e) => isPlannable(e) && e.day === day && e.prog === prog)
    .sort((a, b) => a.order - b.order);
}

/** Whether the program is tagged per-day (any plannable exercise has day + prog). */
export function hasDayProgPlan(exercises: ProgramExercise[]): boolean {
  return exercises.some((e) => isPlannable(e) && !!e.day && !!e.prog);
}

/** The client's training days (parsed from the schedule), e.g. ['Mon','Wed','Fri']. */
export function programDays(client: Pick<Client, 'days'>): string[] {
  return parseDays(client.days);
}

/** Count of plannable exercises in a (day, prog) slot. */
export function slotCount(exercises: ProgramExercise[], day: string, prog: ProgLabel): number {
  return exForDayProg(exercises, day, prog).length;
}
