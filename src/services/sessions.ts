// Session-log reads. sessionLog lives per-client (clients/{id}/sessionLog/{date});
// a collection-group query gathers completed sessions across all clients. The
// emulator doesn't require indexes; we sort client-side to avoid needing one.
import { collectionGroup, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { SessionLog } from '../domain/types';

export interface SessionLogWithClient extends SessionLog {
  clientId: string;
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
