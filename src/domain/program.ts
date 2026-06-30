// Pure per-day program helpers. The standing program is planned per training day
// with one or more circuit slots (Program A, B, C…); each exercise is tagged with
// `day` + `prog`. These helpers group/filter that flat list — no Firebase, no React.
import type { Client, ProgKey, ProgramExercise } from './types';
import { parseDays } from './client';

export type ProgLabel = ProgKey;
/** All possible program slots (A–F), in order — used for deriving + adding programs. */
export const PROG_LABELS: ProgLabel[] = ['A', 'B', 'C', 'D', 'E', 'F'];

/** The program labels actually present for a day (have ≥1 exercise), in A→F order. */
export function dayProgLabels(exercises: ProgramExercise[], day: string): ProgLabel[] {
  return PROG_LABELS.filter((p) => exForDayProg(exercises, day, p).length > 0);
}

/** The next free program label given the labels already in use, or null once F is used. */
export function nextProgLabel(inUse: ProgLabel[]): ProgLabel | null {
  return PROG_LABELS.find((p) => !inUse.includes(p)) ?? null;
}

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

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Today as a 3-letter weekday label ('Mon'…'Sun'). */
export function todayWeekday(): string {
  return DAY_ORDER[(new Date().getDay() + 6) % 7];
}

/**
 * Which scheduled day today's session runs: today if it's a training day, else
 * the next scheduled day (wrapping the week). null when no days are set.
 */
export function sessionDayFor(client: Pick<Client, 'days'>): string | null {
  const days = programDays(client);
  if (!days.length) return null;
  const today = todayWeekday();
  if (days.includes(today)) return today;
  const ti = DAY_ORDER.indexOf(today);
  for (let i = 1; i <= 7; i++) {
    const d = DAY_ORDER[(ti + i) % 7];
    if (days.includes(d)) return d;
  }
  return days[0];
}

/** Count of plannable exercises in a (day, prog) slot. */
export function slotCount(exercises: ProgramExercise[], day: string, prog: ProgLabel): number {
  return exForDayProg(exercises, day, prog).length;
}
