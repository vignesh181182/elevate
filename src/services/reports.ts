// Report status reads + mark-sent — readable/writable by any signed-in coach.
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Report } from '../domain/types';

export async function fetchReports(): Promise<Report[]> {
  const snap = await getDocs(collection(db, 'reports'));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Report, 'id'>) }));
}

/**
 * Record that a client's week-N report was sent (any coach). Upserts reports/{clientId}-wN
 * so the Reports list badge flips to "Sent". Money-free — reports carry no billing data.
 */
export async function markReportSent(clientId: string, week: number, when: string): Promise<void> {
  await setDoc(doc(db, 'reports', `${clientId}-w${week}`), { clientId, week, sent: true, when }, { merge: true });
}
