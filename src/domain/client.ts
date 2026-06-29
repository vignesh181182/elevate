// Pure client-lifecycle helpers ported from the prototype.
import type { Client, ClientProgram, ProgramExercise } from './types';

export type ClientStage = 'Schedule pending' | null;

/**
 * Onboarding stage; null once fully set up. In the money-decoupled model, assigning
 * a schedule & coach is what activates a client (scheduleSet), so a lead is simply
 * "Schedule pending" — the fee-gated assessment/welcome sub-stages were dropped.
 */
export function clientStage(c: Pick<Client, 'scheduleSet'>): ClientStage {
  return c.scheduleSet ? null : 'Schedule pending';
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

/** Time/level-based exercise (planks, walks, etc.) — reps column means seconds/level, no weight. */
export function isRepBased(ex: Pick<ProgramExercise, 'target' | 'name'>): boolean {
  const t = (ex.target ?? '').trim();
  return /s$|min/i.test(t) || /step|balance|walk|wall|circuit|plank/i.test(ex.name ?? '');
}

/** The week's load, carrying forward the most recent earlier week when unset (default 0kg × 8). */
export function weekLoad(ex: ProgramExercise, week: number): { w: number; r: number } {
  const logs = ex.logs ?? {};
  if (logs[week]) return logs[week];
  for (let w = week - 1; w >= 1; w--) if (logs[w]) return logs[w];
  return { w: 0, r: 8 };
}

/** The live program week, derived from the start date and clamped to 1..weeks. */
export function currentProgramWeek(c: Pick<Client, 'program' | 'programStartDate'>): number {
  const weeks = c.program?.weeks ?? 6;
  if (!c.programStartDate) return 1;
  const start = new Date(c.programStartDate + 'T00:00:00');
  if (isNaN(+start)) return 1;
  const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00');
  const days = Math.floor((+today - +start) / 86400000);
  return Math.max(1, Math.min(weeks, Math.floor(days / 7) + 1));
}
