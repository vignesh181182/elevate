// Coach reads — the coaches collection is readable by any signed-in coach.
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { Coach } from '../domain/types';

export async function fetchCoaches(): Promise<Coach[]> {
  const snap = await getDocs(collection(db, 'coaches'));
  return snap.docs.map((d) => d.data() as Coach);
}
