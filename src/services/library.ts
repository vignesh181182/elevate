// Exercise library reads — the shared catalog, readable by any signed-in coach.
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { LibraryExercise } from '../domain/types';

export async function fetchLibrary(): Promise<LibraryExercise[]> {
  const snap = await getDocs(collection(db, 'library'));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LibraryExercise, 'id'>) }));
}
