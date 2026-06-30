// Client data-access layer (Firestore reads). Per the access model, ALL coaches
// see ALL clients — only payment data is gated (see services/payments.ts +
// firestore.rules). So these reads are not coach-filtered.
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Assessment, Client, ClientStatus, ProgKey, ProgramExercise, ProgramHistory } from '../domain/types';

/** Fields a coach fills in the add-client form; everything else is defaulted. */
export interface NewClientInput {
  name: string;
  age: number;
  phone: string; // already formatted, e.g. "+91 98765 43210"
  email: string; // '' when not provided
  category: string;
  ability: string;
  goals: string;
  medical: string;
  activity: string;
}

export async function fetchClients(): Promise<Client[]> {
  const snap = await getDocs(query(collection(db, 'clients'), orderBy('name')));
  return snap.docs.map((d) => d.data() as Client);
}

export async function fetchClient(id: string): Promise<Client | null> {
  const snap = await getDoc(doc(db, 'clients', id));
  return snap.exists() ? (snap.data() as Client) : null;
}

/** A library pick to add into a client's standing program. */
export interface NewProgramExercise {
  name: string;
  group?: string;
  target: string;
}

/**
 * Append exercises to a client's program (any coach). Each lands after the current
 * last (order = max+1) with empty per-week logs, in one atomic batch. When a `slot`
 * is given, the new exercises are tagged into that day's Program A/B.
 */
export async function addProgramExercises(
  clientId: string,
  items: NewProgramExercise[],
  slot?: { day: string; prog: ProgKey },
): Promise<void> {
  if (!items.length) return;
  const col = collection(db, 'clients', clientId, 'exercises');
  const snap = await getDocs(col);
  let order = snap.docs.reduce((m, d) => Math.max(m, (d.data() as ProgramExercise).order ?? 0), 0);
  const batch = writeBatch(db);
  for (const it of items) {
    order += 1;
    batch.set(doc(col), {
      name: it.name,
      group: it.group ?? '',
      target: it.target,
      order,
      logs: {},
      ...(slot ? { day: slot.day, prog: slot.prog } : {}),
    });
  }
  await batch.commit();
}

/** Remove one exercise from a client's program. */
export async function removeProgramExercise(clientId: string, exId: string): Promise<void> {
  await deleteDoc(doc(db, 'clients', clientId, 'exercises', exId));
}

/** Remove several exercises at once (e.g. an entire program slot) in one batch. */
export async function removeProgramExercises(clientId: string, exIds: string[]): Promise<void> {
  if (!exIds.length) return;
  const batch = writeBatch(db);
  for (const exId of exIds) batch.delete(doc(db, 'clients', clientId, 'exercises', exId));
  await batch.commit();
}

/** Persist a new exercise order — writes order = 1..N in the given id sequence, atomically. */
export async function reorderProgramExercises(clientId: string, orderedIds: string[]): Promise<void> {
  if (!orderedIds.length) return;
  const batch = writeBatch(db);
  orderedIds.forEach((id, i) => batch.update(doc(db, 'clients', clientId, 'exercises', id), { order: i + 1 }));
  await batch.commit();
}

/** One exercise's weight/reps for a given week. */
export interface WeekLoad {
  exId: string;
  w: number;
  r: number;
}

/**
 * Save per-week loads for a program week (any coach). Uses the dotted `logs.{week}`
 * field path so only that week is written — other weeks' logs are untouched — all in
 * one atomic batch.
 */
export async function saveWeekLoads(clientId: string, week: number, loads: WeekLoad[]): Promise<void> {
  if (!loads.length) return;
  const batch = writeBatch(db);
  for (const l of loads) {
    batch.update(doc(db, 'clients', clientId, 'exercises', l.exId), { [`logs.${week}`]: { w: l.w, r: l.r } });
  }
  await batch.commit();
}

/** Patch editable fields of a program exercise (target now; name/group later). */
export async function updateProgramExercise(
  clientId: string,
  exId: string,
  patch: Partial<Pick<ProgramExercise, 'name' | 'group' | 'target' | 'future'>>,
): Promise<void> {
  await updateDoc(doc(db, 'clients', clientId, 'exercises', exId), patch);
}

export async function fetchClientExercises(id: string): Promise<ProgramExercise[]> {
  const snap = await getDocs(query(collection(db, 'clients', id, 'exercises'), orderBy('order')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ProgramExercise, 'id'>) }));
}

/**
 * Create a new client as a fresh lead — coachId null, all onboarding lifecycle
 * flags false. Also seeds an empty billing summary so onboarding payments land in
 * the ledger. Returns the new auto-generated id. (Any coach may add a client.)
 */
export async function createClient(input: NewClientInput): Promise<string> {
  const now = new Date();
  const joined = now.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  const start = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const ref = doc(collection(db, 'clients'));
  const client: Client = {
    id: ref.id,
    name: input.name,
    age: input.age,
    phone: input.phone,
    category: input.category,
    ability: input.ability,
    status: 'Active',
    coachId: null,
    joined,
    start,
    sessions: 0,
    days: '—',
    time: '—',
    goals: input.goals.trim() || '—',
    medical: input.medical.trim() || 'None reported',
    activity: input.activity.trim() || '—',
    injuries: 'None',
    assessmentDone: false,
    scheduleDone: false,
    scheduleSet: false,
    measures: {},
    program: null,
  };
  if (input.email.trim()) client.email = input.email.trim();

  await setDoc(ref, client);
  // Empty package-balance summary, mirroring the seed — onboarding payments build on it.
  await setDoc(doc(db, 'clients', ref.id, 'billing', 'summary'), {
    sessionsRemaining: 0,
    packageSize: 0,
    lastSessionDate: null,
  });
  return ref.id;
}

const WEEK_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Schedule & coach assignment from the activation form. */
export interface ScheduleInput {
  coachId: string;
  days: string[]; // e.g. ['Mon','Wed','Fri']
  time: string; // "5:30 PM"
  weeks: number; // program length
  sessionDuration: number; // minutes
  programStartDate: string; // YYYY-MM-DD
}

/**
 * Assign a coach + training schedule + first program (onboarding step 2). Sets
 * scheduleDone — but NOT scheduleSet: full activation waits for the welcome note
 * (step 3, completeWelcome). Money-free by design: the head coach records the
 * package separately via payment (juniors never touch billing). Any coach may run
 * this; it also serves re-edits (scheduleSet, once set, is left untouched).
 */
export async function setClientSchedule(id: string, input: ScheduleInput): Promise<void> {
  const days = [...input.days].sort((a, b) => WEEK_ORDER.indexOf(a) - WEEK_ORDER.indexOf(b));
  await updateDoc(doc(db, 'clients', id), {
    coachId: input.coachId,
    days: days.join(', '),
    time: input.time,
    sessionDuration: input.sessionDuration,
    programStartDate: input.programStartDate,
    program: { no: 1, weeks: input.weeks, perWeek: 3, done: 0, startDate: input.programStartDate },
    scheduleDone: true,
  });
}

/** Editable client profile fields — identity + category + coach (never billing). */
export interface EditClientInput {
  name: string;
  age: number;
  phone: string; // already formatted, e.g. "+91 98765 43210"
  email: string; // '' when not provided
  category: string;
  ability: string;
  coachId: string | null; // null = not assigned
}

/**
 * Update a client's profile (any coach — training/identity data, not billing). Only
 * the editable fields are touched; lifecycle flags, program and measures are untouched.
 */
export async function updateClient(id: string, input: EditClientInput): Promise<void> {
  await updateDoc(doc(db, 'clients', id), {
    name: input.name,
    age: input.age,
    phone: input.phone,
    email: input.email,
    category: input.category,
    ability: input.ability,
    coachId: input.coachId,
  });
}

/**
 * Onboarding step 3: attach the welcome note AND activate the client (scheduleSet=true)
 * — this is what flips a lead to a fully active client. Any coach.
 */
export async function completeWelcome(id: string, message: string): Promise<void> {
  await updateDoc(doc(db, 'clients', id), { welcomeMsg: message, scheduleSet: true });
}

/** Quick single-concern patch from the client menu — status flip or coach swap. */
export async function patchClient(
  id: string,
  patch: { status?: ClientStatus; coachId?: string | null },
): Promise<void> {
  await updateDoc(doc(db, 'clients', id), patch);
}

export interface AssessmentInput {
  assessment: Assessment;
  measures: Record<string, number[]>; // full merged map (baseline-seeded, history preserved)
}

/**
 * Save a client's first-assessment (any coach — training data, not billing). Stores
 * the assessment, flips assessmentDone, and writes the measures map (already merged
 * by the caller so existing series aren't clobbered). Money-free: the assessment fee
 * is recorded separately via the payment flow.
 */
export async function saveAssessment(id: string, input: AssessmentInput): Promise<void> {
  await updateDoc(doc(db, 'clients', id), {
    assessment: input.assessment,
    assessmentDone: true,
    measures: input.measures,
  });
}

/**
 * Set a program's session-circuit sets count (any coach — training data, one
 * dataset). Writes the dotted `program.sets.{label}` field so the other label and
 * the rest of the program are untouched.
 */
export async function setProgramSets(clientId: string, label: ProgKey, n: number): Promise<void> {
  await updateDoc(doc(db, 'clients', clientId), { [`program.sets.${label}`]: n });
}

export async function fetchProgramHistory(id: string): Promise<ProgramHistory[]> {
  const snap = await getDocs(collection(db, 'clients', id, 'programHistory'));
  return snap.docs
    .map((d) => d.data() as ProgramHistory)
    .sort((a, b) => a.no - b.no);
}
