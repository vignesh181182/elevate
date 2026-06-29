// Session-log reads. sessionLog lives per-client (clients/{id}/sessionLog/{date});
// a collection-group query gathers completed sessions across all clients. The
// emulator doesn't require indexes; we sort client-side to avoid needing one.
import { collection, collectionGroup, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { SessionLog } from '../domain/types';

export interface SessionLogWithClient extends SessionLog {
  clientId: string;
}

/** One client's completed-session history, newest first. */
export async function fetchSessionLog(clientId: string): Promise<SessionLog[]> {
  const snap = await getDocs(collection(db, 'clients', clientId, 'sessionLog'));
  return snap.docs.map((d) => d.data() as SessionLog).sort((a, b) => (a.date < b.date ? 1 : -1));
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
