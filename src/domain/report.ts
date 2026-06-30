// Pure weekly-report derivation. Everything here comes from real logged data —
// the reporting period, the sessions strip, and the performance table. No fabricated
// commentary, attendance, or dates (the prototype hardcoded all three).
import type { ProgramExercise, SessionLog } from './types';
import { isRepBased } from './client';
import { parseDays } from './client';

const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Local YYYY-MM-DD. */
function key(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Monday of the week containing `d` (local). */
function mondayOf(d: Date): Date {
  const m = new Date(d);
  m.setHours(0, 0, 0, 0);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

/** Real reporting period for the current week, e.g. "19 – 25 May 2025". */
export function reportPeriod(today = new Date()): string {
  const mon = mondayOf(today);
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  const dM = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short' });
  const sameMonth = mon.getMonth() === sun.getMonth();
  const left = sameMonth ? `${mon.getDate()}` : `${mon.getDate()} ${dM(mon)}`;
  return `${left} – ${sun.getDate()} ${dM(sun)} ${sun.getFullYear()}`;
}

export interface ReportDay {
  d: string;
  st: 'done' | 'missed' | 'rest';
}
export interface WeekSessions {
  days: ReportDay[];
  done: number;
  total: number;
  pct: number;
}

/**
 * This week's sessions, derived from the schedule + completed-session log. A scheduled
 * day is `done` if a session was logged that date, `missed` if it's already past, else
 * `rest` (not scheduled, or scheduled but still upcoming). total = scheduled/week.
 */
export function weekSessions(days: string, log: SessionLog[], today = new Date()): WeekSessions {
  const scheduled = new Set(parseDays(days));
  const mon = mondayOf(today);
  const todayK = key(today);
  const logged = new Set(log.map((r) => r.date));

  const out: ReportDay[] = WD.map((d, i) => {
    if (!scheduled.has(d)) return { d, st: 'rest' };
    const date = new Date(mon);
    date.setDate(date.getDate() + i);
    const dk = key(date);
    if (logged.has(dk)) return { d, st: 'done' };
    if (dk < todayK) return { d, st: 'missed' };
    return { d, st: 'rest' };
  });

  const total = scheduled.size;
  const done = out.filter((x) => x.st === 'done').length;
  return { days: out, done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export interface PerfRow {
  name: string;
  prev: string;
  now: string;
  imp: string;
  cls: 'up' | 'down' | 'flat';
  arr: string;
  ic: string;
}

function exIcon(name: string): string {
  const n = name.toLowerCase();
  if (/squat|lunge|leg/.test(n)) return '🦵';
  if (/pull|row|lat|chin/.test(n)) return '💪';
  if (/plank|core|bridge/.test(n)) return '🧘';
  if (/balance|step|wall|walk|incline/.test(n)) return '🤸';
  return '🏋️';
}

function repVal(ex: ProgramExercise, log: { w: number; r: number } | undefined): { n: number; disp: string } | null {
  if (!log) return null;
  if (!isRepBased(ex)) return { n: log.w, disp: `${log.w} kg × ${log.r}` };
  if (log.w > 0) {
    const t = (ex.target ?? '').trim();
    const u = /min/.test(t) ? ' min' : /s$/.test(t) ? 's' : '';
    return { n: log.w, disp: `${log.w}${u}` };
  }
  return { n: log.r, disp: `${log.r} reps` };
}

/** Sorted numeric week keys that have a log. */
function loggedWeeks(ex: ProgramExercise): number[] {
  return Object.keys(ex.logs ?? {})
    .map(Number)
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);
}

/**
 * Performance table: each exercise's previous best (any earlier week) → its latest
 * logged week, with the improvement. Exercises with no logs are omitted.
 */
export function performanceRows(exercises: ProgramExercise[]): PerfRow[] {
  const rows: PerfRow[] = [];
  for (const ex of exercises) {
    const weeks = loggedWeeks(ex);
    if (!weeks.length) continue;
    const latest = weeks[weeks.length - 1];
    const now = repVal(ex, ex.logs[String(latest)]);
    if (!now) continue;

    // best of all earlier weeks
    let prev: { n: number; disp: string } | null = null;
    for (const w of weeks) {
      if (w >= latest) break;
      const v = repVal(ex, ex.logs[String(w)]);
      if (v && (prev === null || v.n > prev.n)) prev = v;
    }

    let imp = 'New';
    let cls: PerfRow['cls'] = 'flat';
    let arr = '';
    if (prev) {
      const d = Math.round((now.n - prev.n) * 10) / 10;
      const a = Math.abs(d);
      const sign = d > 0 ? '+' : '−';
      const t = (ex.target ?? '').trim();
      const unit = !isRepBased(ex) ? ' kg' : /min/.test(t) ? ' min' : /s$/.test(t) ? 's' : ' reps';
      if (d > 0) {
        imp = `${sign}${a}${unit}`;
        cls = 'up';
        arr = '↑';
      } else if (d < 0) {
        imp = `${sign}${a}${unit}`;
        cls = 'down';
        arr = '↓';
      } else {
        imp = 'Maintained';
        cls = 'flat';
        arr = '→';
      }
    }
    rows.push({ name: ex.name, prev: prev ? prev.disp : '—', now: now.disp, imp, cls, arr, ic: exIcon(ex.name) });
  }
  return rows;
}

export const GYM = {
  name: 'Elevate Fitness',
  phone: '+91 98765 43210',
  email: 'info@elevatefitness.com',
  web: 'www.elevatefitness.com',
};
