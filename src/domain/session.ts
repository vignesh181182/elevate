// Pure A/B-circuit logic for today's session. The programs are DERIVED from the
// client's flat exercise list (first half = Program A, second = Program B) and run
// a fixed number of rounds; only the per-tick progress is persisted (keyed
// "label:round:name"). Everything else — active program, current round, next
// exercise, completion — is computed here. No Firebase, no React.
import type { ProgramExercise } from './types';
import { exForDayProg, hasDayProgPlan, PROG_LABELS } from './program';

export const ROUNDS = 3;

/** Allowed range for the editable per-program sets count. */
export const MIN_SETS = 1;
export const MAX_SETS = 9;

export type ProgramLabel = 'A' | 'B';

/** Per-program sets count, keyed by label (absent ⇒ ROUNDS). */
export type SetsByLabel = Partial<Record<ProgramLabel, number>>;

export interface CircuitProgram {
  label: ProgramLabel;
  exercises: ProgramExercise[];
  // How many rounds this program runs. Defaults to ROUNDS when unset.
  sets?: number;
}

/** The rounds this program runs — its own `sets`, or the ROUNDS default. */
export function programRounds(p: CircuitProgram): number {
  return p.sets ?? ROUNDS;
}

/** Progress map persisted on the session doc — true when a (program,round,exercise) is ticked. */
export type Progress = Record<string, boolean>;

/** Split the flat program in half into Program A & B, dropping an empty half. */
export function splitPrograms(list: ProgramExercise[]): CircuitProgram[] {
  const half = Math.ceil(list.length / 2);
  return (
    [
      { label: 'A', exercises: list.slice(0, half) },
      { label: 'B', exercises: list.slice(half) },
    ] as CircuitProgram[]
  ).filter((p) => p.exercises.length > 0);
}

/**
 * Today's circuit programs. When the standing plan is tagged per training day,
 * Program A/B ARE that day's tagged slots (one dataset — no separate split to
 * maintain). Otherwise (paused/untagged clients) fall back to halving the flat
 * list so a circuit can still be built. Empty programs are dropped.
 */
export function circuitPrograms(
  list: ProgramExercise[],
  day: string | null,
  setsByLabel?: SetsByLabel,
): CircuitProgram[] {
  const withSets = (programs: CircuitProgram[]) =>
    setsByLabel
      ? programs.map((p) => (setsByLabel[p.label] != null ? { ...p, sets: setsByLabel[p.label] } : p))
      : programs;
  if (day && hasDayProgPlan(list)) {
    const tagged = PROG_LABELS.map((label) => ({ label, exercises: exForDayProg(list, day, label) })).filter(
      (p) => p.exercises.length > 0,
    );
    if (tagged.length) return withSets(tagged);
  }
  return withSets(splitPrograms(list));
}

/** Progress key for one set: "A:1:Back squat". */
export function progressKey(label: ProgramLabel, round: number, name: string): string {
  return `${label}:${round}:${name}`;
}

/** Every exercise in the program ticked for this round (empty program ⇒ nothing to do). */
export function roundComplete(p: CircuitProgram, round: number, progress: Progress): boolean {
  if (!p.exercises.length) return true;
  return p.exercises.every((e) => !!progress[progressKey(p.label, round, e.name)]);
}

/** All of the program's rounds complete. */
export function programComplete(p: CircuitProgram, progress: Progress): boolean {
  if (!p.exercises.length) return true;
  const rounds = programRounds(p);
  for (let r = 1; r <= rounds; r++) if (!roundComplete(p, r, progress)) return false;
  return true;
}

/** The round being worked — the lowest incomplete round, clamped to the last. */
export function currentRound(p: CircuitProgram, progress: Progress): number {
  const rounds = programRounds(p);
  for (let r = 1; r <= rounds; r++) if (!roundComplete(p, r, progress)) return r;
  return rounds;
}

/** First not-yet-ticked exercise name in the round (the "Next up"), or null. */
export function nextExercise(p: CircuitProgram, round: number, progress: Progress): string | null {
  return p.exercises.find((e) => !progress[progressKey(p.label, round, e.name)])?.name ?? null;
}

/** Index of the program currently being worked (first incomplete); -1 when all are complete. */
export function activeProgramIndex(programs: CircuitProgram[], progress: Progress): number {
  return programs.findIndex((p) => !programComplete(p, progress));
}

/** The whole session is complete: there's something to do and every program is done. */
export function sessionComplete(programs: CircuitProgram[], progress: Progress): boolean {
  return programs.some((p) => p.exercises.length > 0) && programs.every((p) => programComplete(p, progress));
}

/** Rounds completed / total across non-empty programs — for the archive + progress label. */
export function roundCounts(programs: CircuitProgram[], progress: Progress): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const p of programs) {
    if (!p.exercises.length) continue;
    const rounds = programRounds(p);
    total += rounds;
    for (let r = 1; r <= rounds; r++) if (roundComplete(p, r, progress)) done++;
  }
  return { done, total };
}
