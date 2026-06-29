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
}

/** clients/{id}/exercises/{exId} — source of truth for the standing program. */
export interface ProgramExercise {
  id?: string;
  name: string;
  group?: string;
  target: string;
  order: number;
  future?: boolean;
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
