// Report status reads — readable by any signed-in coach.
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { Report } from '../domain/types';

export async function fetchReports(): Promise<Report[]> {
  const snap = await getDocs(collection(db, 'reports'));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Report, 'id'>) }));
}
