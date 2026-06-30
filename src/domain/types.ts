// Central domain types — the shapes stored in Firestore and consumed by the app.
// Grows as milestones land.

export type CoachRole = 'main' | 'junior';

export interface Coach {
  id: string; // == Firebase Auth uid
  name: string;
  email: string;
  role: CoachRole;
  photo?: string;
  phone?: string;
  yearsExp?: number;
  specializations?: string[];
  certifications?: string[];
  tagline?: string;
  bio?: string;
}

export type ClientStatus = 'Active' | 'Paused';

/** Active program metadata. The exercises live in the `exercises` subcollection. */
export interface ClientProgram {
  no: number;
  name?: string;
  weeks: number;
  perWeek: number;
  done: number; // sessions completed in this program
  startDate?: string; // YYYY-MM-DD
  // Rounds (sets) the session circuit runs per A/B program. Edited in the Program
  // editor, drives ClientSession. Per-program (A and B independent); absent ⇒ ROUNDS.
  sets?: { A?: number; B?: number };
}

export interface ReviewState {
  due: boolean;
  ago: string;
}

/** clients/{id} */
export interface Client {
  id: string;
  name: string;
  age: number;
  phone: string;
  email?: string;
  category: string;
  ability: string;
  status: ClientStatus;
  coachId: string | null; // assigned coach uid; null for a fresh lead
  joined: string;
  start: string;
  programStartDate?: string;
  sessions: number;
  days: string;
  time: string;
  goals: string;
  medical: string;
  activity: string;
  injuries: string;
  // staged-onboarding lifecycle flags
  assessmentDone: boolean;
  scheduleDone: boolean;
  scheduleSet: boolean;
  measures: Record<string, number[]>;
  program: ClientProgram | null;
  review?: ReviewState;
  welcomeMsg?: string;
  sessionDuration?: number;
  assessment?: Assessment;
}

/**
 * A client's baseline first-assessment, stored on the client doc (training data, not
 * billing — any coach reads/writes). Money-decoupled: the assessment FEE is recorded
 * separately via the payment flow, so there is no fee gate here. `by` is the coach uid.
 */
export interface Assessment {
  date: string; // YYYY-MM-DD it was captured
  by: string; // coach uid who assessed
  weight?: number; // kg
  height?: number; // cm
  waist?: number; // cm
  ratings: Record<string, number>; // dimension key → 1..5
  bodyType?: string;
  fitnessLevel?: string;
  primaryGoal?: string;
  focusAreas: string[];
  notes?: string;
}

/** clients/{id}/exercises/{exId} — source of truth for the standing program. */
export interface ProgramExercise {
  id?: string;
  name: string;
  group?: string;
  target: string;
  order: number;
  future?: boolean;
  // Per-day A/B plan: the scheduled weekday + A/B slot this exercise belongs to.
  // Optional during migration; once tagged, the program is planned per training day.
  day?: string; // e.g. 'Mon'
  prog?: 'A' | 'B';
  logs: Record<string, { w: number; r: number }>; // keyed by week number
}

/** clients/{id}/programHistory/{id} — archived past programs. */
export interface ProgramHistory {
  id: number;
  name: string;
  no: number;
  startDate: string;
  endDate: string;
  weeks: number;
  perWeek: number;
  sessionsCompleted: number;
  exercises: { name: string; target: string }[];
  notes: string;
}

export type PaymentType = 'package' | 'assessment';
export type PaymentStatusValue = 'Paid' | 'Pending';

/** clients/{id}/payments/{id} — MAIN COACH ONLY (Security Rules). */
export interface Payment {
  id: number;
  date: string;
  type: PaymentType;
  packageSize: number | null;
  sessions: number | null;
  status: PaymentStatusValue;
  notes: string;
}

/** clients/{id}/billing/summary — main reads; any coach increments on completion. */
export interface Billing {
  sessionsRemaining: number;
  packageSize: number;
  lastSessionDate: string | null; // YYYY-MM-DD
}

/** Derived payment state (computed, never stored). */
export type PaymentStatus = 'Paid' | 'DueSoon' | 'Overdue' | 'New';

/** library/{id} — shared exercise catalog. */
export interface LibraryExercise {
  id?: string;
  name: string;
  group: string;
  category: string;
  target: string;
}

export type Attendance = 'present' | 'absent' | 'cancelled';

/**
 * clients/{id}/sessions/{date} — a single day's live session state. Attendance is
 * recorded here now; the A/B circuit (split, rounds, progress) will share the same
 * doc later, so writes MUST merge to avoid clobbering each other.
 */
export interface SessionDoc {
  attendance?: Attendance;
  markedAt?: string; // ISO timestamp the attendance was set
  markedBy?: string; // coach uid who marked it
  // A/B circuit — programs are derived (the flat list split in half), 3 fixed rounds,
  // so only the ticks + completion are stored. progress keys: "A:1:Back squat".
  progress?: Record<string, boolean>;
  status?: 'completed';
  completedAt?: string; // ISO when the session was completed
  early?: boolean; // completed with partial progress
}

/** clients/{id}/sessionLog/{date} — permanent completed-session archive. */
export interface SessionLog {
  id?: string;
  date: string; // YYYY-MM-DD
  when: string;
  early: boolean;
  roundsCompleted: number;
  totalRounds: number;
  programs: { label: string; sets: number; exercises: string[] }[];
}

/** clients/{id}/media/{mediaId} — one compressed photo (base64 data URL) per doc. */
export interface Media {
  id?: string;
  data: string; // base64 data URL
  kind?: 'before' | 'progress';
  caption?: string;
  createdAt?: string;
}

/** reports/{id} */
export interface Report {
  id?: string;
  clientId: string;
  week: number;
  sent: boolean;
  when?: string;
}
