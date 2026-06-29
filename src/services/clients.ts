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
import type { Client, ProgramExercise, ProgramHistory } from '../domain/types';

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
 * last (order = max+1) with empty per-week logs, in one atomic batch.
 */
export async function addProgramExercises(clientId: string, items: NewProgramExercise[]): Promise<void> {
  if (!items.length) return;
  const col = collection(db, 'clients', clientId, 'exercises');
  const snap = await getDocs(col);
  let order = snap.docs.reduce((m, d) => Math.max(m, (d.data() as ProgramExercise).order ?? 0), 0);
  const batch = writeBatch(db);
  for (const it of items) {
    order += 1;
    batch.set(doc(col), { name: it.name, group: it.group ?? '', target: it.target, order, logs: {} });
  }
  await batch.commit();
}

/** Remove one exercise from a client's program. */
export async function removeProgramExercise(clientId: string, exId: string): Promise<void> {
  await deleteDoc(doc(db, 'clients', clientId, 'exercises', exId));
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
 * Assign a coach + training schedule + first program, activating the client
 * (scheduleSet=true). Money-free by design: the head coach records the program
 * package separately via the payment flow (juniors never touch billing). Any coach
 * may run this. Works for both first setup and editing an existing schedule.
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
    scheduleSet: true,
  });
}

export async function fetchProgramHistory(id: string): Promise<ProgramHistory[]> {
  const snap = await getDocs(collection(db, 'clients', id, 'programHistory'));
  return snap.docs
    .map((d) => d.data() as ProgramHistory)
    .sort((a, b) => a.no - b.no);
}
