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

/** A circuit/program slot label within a training day (A–F, like the prototype). */
export type ProgKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

/** Active program metadata. The exercises live in the `exercises` subcollection. */
export interface ClientProgram {
  no: number;
  name?: string;
  weeks: number;
  perWeek: number;
  done: number; // sessions completed in this program
  startDate?: string; // YYYY-MM-DD
  // Onboarding program-fee status (flag only — the head coach records the actual
  // payment in the ledger via Record Payment; juniors can't write payments).
  paid?: boolean;
  paidOn?: string; // YYYY-MM-DD the fee was marked Paid
  // Rounds (sets) the session circuit runs per program, keyed by label. Edited in the
  // Program editor, drives ClientSession. Per-program independent; a label absent ⇒ ROUNDS.
  sets?: Partial<Record<ProgKey, number>>;
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
  // Onboarding assessment-fee status (flag only — the actual payment is recorded
  // separately in the ledger by the head coach; see ClientProgram.paid for the program fee).
  assessmentPaid?: boolean;
  assessmentPaidOn?: string; // YYYY-MM-DD the fee was marked Paid
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
  summary?: string; // coach-written first-assessment summary (filled on the welcome step)
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
  prog?: ProgKey;
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
 * One session comment (the session-notes thread). Stored on the session doc as a map
 * keyed by id (merge-safe, like progress/setLogs); `by` is the authoring coach uid.
 */
export interface SessionComment {
  by: string; // coach uid who wrote it
  text: string;
  at: string; // ISO timestamp created
  editedAt?: string; // ISO timestamp last edited
}

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
  // Per-set actuals logged live during the session, keyed identically to progress
  // ("A:1:Back squat"). Each is the weight/reps the coach actually worked that set;
  // on completion the top set folds into the exercise's per-week log (the charts).
  setLogs?: Record<string, { w: number; r: number }>;
  // Sets the coach explicitly skipped, keyed like progress. A skip also ticks progress
  // (so the circuit advances to the next exercise) but is recorded here with its reason.
  skips?: Record<string, { reason?: string; at?: string }>;
  status?: 'completed';
  completedAt?: string; // ISO when the session was completed
  early?: boolean; // completed with partial progress
  // Session-notes comment thread, keyed by comment id (merge-safe map). Each carries the
  // authoring coach + timestamps; folded into the SessionLog archive on completion.
  comments?: Record<string, SessionComment>;
  // Legacy single free-text note (pre-comments). Kept for older docs; read-only.
  note?: string;
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
  // Per-set actuals at completion (key "A:1:Back squat" → {w,r}) — the permanent
  // record of what was worked each set; optional (older logs predate it).
  setLogs?: Record<string, { w: number; r: number }>;
  // Sets skipped during the session (key → reason), snapshotted on completion.
  skips?: Record<string, { reason?: string; at?: string }>;
  // Session-notes comment thread, snapshotted on completion (keyed by comment id).
  comments?: Record<string, SessionComment>;
  note?: string; // legacy single note, snapshotted on completion

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
