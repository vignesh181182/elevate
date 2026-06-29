// Pure client-lifecycle helpers ported from the prototype.
import type { Client, ClientProgram, ProgramExercise } from './types';

export type ClientStage = 'Assessment pending' | 'Schedule pending' | 'Welcome note pending' | null;

/** Onboarding stage during the staged add-client flow; null once fully set up. */
export function clientStage(c: Pick<Client, 'assessmentDone' | 'scheduleDone' | 'scheduleSet'>): ClientStage {
  if (!c.assessmentDone) return 'Assessment pending';
  if (!c.scheduleDone) return 'Schedule pending';
  if (!c.scheduleSet) return 'Welcome note pending';
  return null;
}

/** A fully set-up client (renders the rich detail page rather than the pending overview). */
export function isActiveClient(c: Pick<Client, 'scheduleSet'>): boolean {
  return c.scheduleSet;
}

/** Display label for the active program — a coach-typed name, else "Program #N". */
export function programDisplayName(p: ClientProgram | null): string {
  if (!p) return 'No active program';
  return p.name || `Program #${p.no ?? 1}`;
}

/** "Mon, Wed, Fri" → ['Mon','Wed','Fri']; '—'/empty → []. */
export function parseDays(days: string | undefined): string[] {
  if (!days || days === '—') return [];
  return days.split(',').map((d) => d.trim()).filter(Boolean);
}

/** Most recent logged set for an exercise, by highest week key (or null). */
export function latestLog(ex: ProgramExercise): { week: number; w: number; r: number } | null {
  const weeks = Object.keys(ex.logs ?? {}).map(Number).filter((n) => !isNaN(n));
  if (!weeks.length) return null;
  const week = Math.max(...weeks);
  const l = ex.logs[String(week)];
  return l ? { week, w: l.w, r: l.r } : null;
}

/** Human label for the latest load — weighted ("60kg × 6") or bodyweight ("9 reps"). */
export function loadLabel(ex: ProgramExercise): string {
  const l = latestLog(ex);
  if (!l) return '';
  return l.w > 0 ? `${l.w}kg × ${l.r}` : `${l.r} reps`;
}
