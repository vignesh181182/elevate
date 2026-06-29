// Session-log reads. sessionLog lives per-client (clients/{id}/sessionLog/{date});
// a collection-group query gathers completed sessions across all clients. The
// emulator doesn't require indexes; we sort client-side to avoid needing one.
import { collection, collectionGroup, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Attendance, SessionDoc, SessionLog } from '../domain/types';

export interface SessionLogWithClient extends SessionLog {
  clientId: string;
}

/** One client's completed-session history, newest first. */
export async function fetchSessionLog(clientId: string): Promise<SessionLog[]> {
  const snap = await getDocs(collection(db, 'clients', clientId, 'sessionLog'));
  return snap.docs.map((d) => d.data() as SessionLog).sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** One client's session doc for a date (attendance + circuit progress), or null. */
export async function fetchSession(clientId: string, date: string): Promise<SessionDoc | null> {
  const snap = await getDoc(doc(db, 'clients', clientId, 'sessions', date));
  return snap.exists() ? (snap.data() as SessionDoc) : null;
}

/** Each listed client's session doc for one date (clientId → SessionDoc), unmarked omitted. */
export async function fetchDaySessions(clientIds: string[], date: string): Promise<Record<string, SessionDoc>> {
  const entries = await Promise.all(
    clientIds.map(async (id) => {
      const snap = await getDoc(doc(db, 'clients', id, 'sessions', date));
      return [id, snap.exists() ? (snap.data() as SessionDoc) : null] as const;
    }),
  );
  const out: Record<string, SessionDoc> = {};
  for (const [id, s] of entries) if (s) out[id] = s;
  return out;
}

/**
 * Mark a client's attendance for a date (any coach). merge:true so the A/B circuit
 * fields that will live on the same doc are preserved.
 */
export async function markAttendance(
  clientId: string,
  date: string,
  status: Attendance,
  markedBy: string,
): Promise<void> {
  await setDoc(
    doc(db, 'clients', clientId, 'sessions', date),
    { attendance: status, markedAt: new Date().toISOString(), markedBy },
    { merge: true },
  );
}

export async function fetchAllSessionLogs(): Promise<SessionLogWithClient[]> {
  const snap = await getDocs(collectionGroup(db, 'sessionLog'));
  return snap.docs
    .map((d) => {
      const clientId = d.ref.parent.parent?.id ?? '';
      return { clientId, ...(d.data() as SessionLog) };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
}
