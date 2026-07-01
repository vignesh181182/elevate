// Pure A/B-circuit logic for today's session. The programs are DERIVED from the
// client's flat exercise list (first half = Program A, second = Program B) and run
// a fixed number of rounds; only the per-tick progress is persisted (keyed
// "label:round:name"). Everything else — active program, current round, next
// exercise, completion — is computed here. No Firebase, no React.
import type { ProgramExercise, SessionComment, SessionLog } from './types';
import { exForDayProg, hasDayProgPlan, PROG_LABELS, type ProgLabel } from './program';
import { estimated1RM } from './progress';

/** One worked set's load. */
export interface SetLoad {
  w: number;
  r: number;
}
export type SetLogs = Record<string, SetLoad>;

/** One skipped set — the coach's reason + when it was skipped. */
export interface SkipInfo {
  reason?: string;
  at?: string;
}
export type Skips = Record<string, SkipInfo>;

/** A session comment with its map-key id attached, ready to render. */
export type CommentWithId = SessionComment & { id: string };

/** Flatten the comments map into a list sorted oldest-first (by creation time). */
export function sortedComments(map: Record<string, SessionComment> | undefined): CommentWithId[] {
  if (!map) return [];
  return Object.entries(map)
    .map(([id, c]) => ({ id, ...c }))
    .sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
}

export const ROUNDS = 3;

/** Allowed range for the editable per-program sets count. */
export const MIN_SETS = 1;
export const MAX_SETS = 9;

export type ProgramLabel = ProgLabel;

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

/**
 * Exercise count + distinct-muscle-group count for a day's circuit — the at-a-glance
 * summary shown on the schedule row. Derived from the same circuitPrograms the session
 * screen runs, so the numbers match what a coach will actually see when they open it.
 */
export function daySummary(
  list: ProgramExercise[],
  day: string | null,
  setsByLabel?: SetsByLabel,
): { exercises: number; groups: number } {
  const exs = circuitPrograms(list, day, setsByLabel).flatMap((p) => p.exercises);
  const groups = new Set(exs.map((e) => e.group).filter(Boolean));
  return { exercises: exs.length, groups: groups.size };
}

/** Completed session logs whose date falls inside [start, end] (end open ⇒ ongoing), newest first. */
export function sessionsInRange(log: SessionLog[], start?: string, end?: string): SessionLog[] {
  return log
    .filter((r) => (!start || r.date >= start) && (!end || r.date <= end))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Progress key for one set: "A:1:Back squat". */
export function progressKey(label: ProgramLabel, round: number, name: string): string {
  return `${label}:${round}:${name}`;
}

/**
 * The load to show/seed for one set: its own logged value, else carried forward from
 * the most recent earlier set in this program, else the prescription fallback. Mirrors
 * the prototype's setLogFor — within a session, a new set inherits the last worked load.
 */
export function setLogFor(
  setLogs: SetLogs | undefined,
  label: ProgramLabel,
  round: number,
  name: string,
  fallback: SetLoad,
): SetLoad {
  const own = setLogs?.[progressKey(label, round, name)];
  if (own) return own;
  if (setLogs) {
    for (let r = round - 1; r >= 1; r--) {
      const prev = setLogs[progressKey(label, r, name)];
      if (prev) return { w: prev.w, r: prev.r };
    }
  }
  return fallback;
}

/**
 * The top set actually worked for an exercise across its rounds — the one with the
 * highest est-1RM (tie → heavier weight). Null when no set was logged for it. This is
 * what folds into the per-week log so the progress charts reflect real performance.
 */
export function exerciseTopSet(
  setLogs: SetLogs | undefined,
  label: ProgramLabel,
  name: string,
  rounds: number,
): SetLoad | null {
  if (!setLogs) return null;
  let best: SetLoad | null = null;
  let bestScore = -Infinity;
  for (let r = 1; r <= rounds; r++) {
    const l = setLogs[progressKey(label, r, name)];
    if (!l) continue;
    const score = estimated1RM(l.w, l.r) || l.w; // bodyweight ⇒ rank by weight (0)
    if (score > bestScore || (score === bestScore && best && l.w > best.w)) {
      best = { w: l.w, r: l.r };
      bestScore = score;
    }
  }
  return best;
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
