// Pure strength-progress metrics, ported from the prototype. Everything is
// DERIVED from per-exercise logs ({week:{w,r}}) — no separately captured metrics.
import type { ProgramExercise } from './types';

export interface ProgPoint {
  week: number;
  weight: number;
  reps: number;
  e1rm: number;
}

/** Epley estimated 1RM. 0 for bodyweight (w<=0) so reps don't fabricate a 1RM. */
export function estimated1RM(w: number, r: number): number {
  w = +w || 0;
  r = +r || 0;
  if (w <= 0) return 0;
  return Math.round(w * (1 + r / 30) * 10) / 10;
}

export function exerciseProgression(exercises: ProgramExercise[], name: string): ProgPoint[] {
  const ex = exercises.find((e) => e.name === name);
  if (!ex || !ex.logs) return [];
  return Object.keys(ex.logs)
    .map(Number)
    .filter((w) => !isNaN(w))
    .sort((a, b) => a - b)
    .map((wk) => {
      const l = ex.logs[String(wk)] || { w: 0, r: 0 };
      return { week: wk, weight: +l.w || 0, reps: +l.r || 0, e1rm: estimated1RM(l.w, l.r) };
    });
}

export function exerciseGainPct(exercises: ProgramExercise[], name: string): number | null {
  const p = exerciseProgression(exercises, name);
  if (p.length < 2) return null;
  const first = p[0].e1rm;
  const last = p[p.length - 1].e1rm;
  if (!first) return null;
  return Math.round(((last - first) / first) * 100);
}

export interface MuscleGroupProg {
  group: string;
  gainPct: number | null;
  sparkline: number[];
}

export function muscleGroupProgress(exercises: ProgramExercise[]): MuscleGroupProg[] {
  const groups: Record<string, ProgPoint[][]> = {};
  exercises.forEach((ex) => {
    if (!ex.group) return;
    const pts = exerciseProgression(exercises, ex.name);
    if (!pts.length) return;
    (groups[ex.group] ||= []).push(pts);
  });
  return Object.keys(groups)
    .map((g) => {
      const exPts = groups[g];
      const gains = exPts
        .map((pts) => {
          if (pts.length < 2) return null;
          const f = pts[0].e1rm;
          const l = pts[pts.length - 1].e1rm;
          return f ? ((l - f) / f) * 100 : null;
        })
        .filter((v): v is number => v != null);
      const gainPct = gains.length ? Math.round(gains.reduce((a, b) => a + b, 0) / gains.length) : null;
      const weekMap: Record<number, number> = {};
      exPts.forEach((pts) => pts.forEach((p) => (weekMap[p.week] = (weekMap[p.week] || 0) + p.e1rm)));
      const sparkline = Object.keys(weekMap)
        .map(Number)
        .sort((a, b) => a - b)
        .map((wk) => Math.round(weekMap[wk] * 10) / 10);
      return { group: g, gainPct, sparkline };
    })
    .sort((a, b) => {
      if (a.gainPct == null && b.gainPct == null) return 0;
      if (a.gainPct == null) return 1;
      if (b.gainPct == null) return -1;
      return b.gainPct - a.gainPct;
    });
}

export function prDate(programStartDate: string | undefined, week: number): string | null {
  if (!programStartDate) return null;
  const d = new Date(programStartDate + 'T00:00:00');
  if (isNaN(+d)) return null;
  d.setDate(d.getDate() + (week - 1) * 7);
  return d.toISOString().slice(0, 10);
}

export interface PR {
  exName: string;
  group?: string;
  week: number;
  weight: number;
  date: string | null;
}

export function detectPRs(exercises: ProgramExercise[], programStartDate?: string): PR[] {
  const prs: PR[] = [];
  exercises.forEach((ex) => {
    if (!ex.logs) return;
    const weeks = Object.keys(ex.logs)
      .map(Number)
      .filter((w) => !isNaN(w))
      .sort((a, b) => a - b);
    let best = -Infinity;
    let seen = false;
    weeks.forEach((wk) => {
      const w = +ex.logs[String(wk)].w || 0;
      if (!seen) {
        best = w;
        seen = true;
        return;
      }
      if (w > best) {
        prs.push({ exName: ex.name, group: ex.group, week: wk, weight: w, date: prDate(programStartDate, wk) });
        best = w;
      }
    });
  });
  return prs.sort((a, b) => b.week - a.week);
}

export function totalVolumeByWeek(exercises: ProgramExercise[]): { week: number; volume: number }[] {
  const weekMap: Record<number, number> = {};
  exercises.forEach((ex) => {
    if (!ex.logs) return;
    Object.keys(ex.logs).forEach((k) => {
      const wk = Number(k);
      if (isNaN(wk)) return;
      const l = ex.logs[k];
      weekMap[wk] = (weekMap[wk] || 0) + (+l.w || 0) * (+l.r || 0);
    });
  });
  return Object.keys(weekMap)
    .map(Number)
    .sort((a, b) => a - b)
    .map((wk) => ({ week: wk, volume: Math.round(weekMap[wk]) }));
}

export interface ProgressSummary {
  avgGain: number | null;
  volChange: number | null;
  prCount: number;
  sessions: number;
}

export function progressSummary(
  exercises: ProgramExercise[],
  programStartDate: string | undefined,
  sessions: number,
): ProgressSummary {
  const gains = exercises.map((e) => exerciseGainPct(exercises, e.name)).filter((v): v is number => v != null);
  const avgGain = gains.length ? Math.round(gains.reduce((a, b) => a + b, 0) / gains.length) : null;
  const vol = totalVolumeByWeek(exercises);
  const volChange =
    vol.length > 1 && vol[0].volume > 0
      ? Math.round(((vol[vol.length - 1].volume - vol[0].volume) / vol[0].volume) * 100)
      : null;
  return { avgGain, volChange, prCount: detectPRs(exercises, programStartDate).length, sessions: sessions || 0 };
}

export function hasProgressData(exercises: ProgramExercise[]): boolean {
  return exercises.some((e) => e.logs && Object.keys(e.logs).length > 0);
}

/** Default exercise for the progression chart — first compound lift, else first. */
export function defaultProgressExercise(exercises: ProgramExercise[]): string | null {
  const withLogs = exercises.filter((e) => e.logs && Object.keys(e.logs).length);
  if (!withLogs.length) return null;
  const compound = withLogs.find((e) => /squat|bench|deadlift|press|row/i.test(e.name));
  return (compound ?? withLogs[0]).name;
}
