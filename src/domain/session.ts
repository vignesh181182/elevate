// Pure A/B-circuit logic for today's session. The programs are DERIVED from the
// client's flat exercise list (first half = Program A, second = Program B) and run
// a fixed number of rounds; only the per-tick progress is persisted (keyed
// "label:round:name"). Everything else — active program, current round, next
// exercise, completion — is computed here. No Firebase, no React.
import type { ProgramExercise } from './types';

export const ROUNDS = 3;

export type ProgramLabel = 'A' | 'B';

export interface CircuitProgram {
  label: ProgramLabel;
  exercises: ProgramExercise[];
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

/** Progress key for one set: "A:1:Back squat". */
export function progressKey(label: ProgramLabel, round: number, name: string): string {
  return `${label}:${round}:${name}`;
}

/** Every exercise in the program ticked for this round (empty program ⇒ nothing to do). */
export function roundComplete(p: CircuitProgram, round: number, progress: Progress): boolean {
  if (!p.exercises.length) return true;
  return p.exercises.every((e) => !!progress[progressKey(p.label, round, e.name)]);
}

/** All ROUNDS rounds of the program complete. */
export function programComplete(p: CircuitProgram, progress: Progress): boolean {
  if (!p.exercises.length) return true;
  for (let r = 1; r <= ROUNDS; r++) if (!roundComplete(p, r, progress)) return false;
  return true;
}

/** The round being worked — the lowest incomplete round, clamped to the last. */
export function currentRound(p: CircuitProgram, progress: Progress): number {
  for (let r = 1; r <= ROUNDS; r++) if (!roundComplete(p, r, progress)) return r;
  return ROUNDS;
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
    total += ROUNDS;
    for (let r = 1; r <= ROUNDS; r++) if (roundComplete(p, r, progress)) done++;
  }
  return { done, total };
}
