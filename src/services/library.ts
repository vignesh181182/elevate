// Exercise library — the shared catalog, readable AND writable by any signed-in
// coach (see firestore.rules: library allow read, write if isAuthed()).
import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { LibraryExercise } from '../domain/types';

export async function fetchLibrary(): Promise<LibraryExercise[]> {
  const snap = await getDocs(collection(db, 'library'));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LibraryExercise, 'id'>) }));
}

/** Fields a coach fills for a library exercise. */
export type LibraryExerciseInput = Omit<LibraryExercise, 'id'>;

/** Add a new exercise to the shared library; returns its new id. */
export async function addLibraryExercise(input: LibraryExerciseInput): Promise<string> {
  const ref = doc(collection(db, 'library'));
  await setDoc(ref, input);
  return ref.id;
}

/** Update an existing library exercise. */
export async function updateLibraryExercise(id: string, patch: Partial<LibraryExerciseInput>): Promise<void> {
  await updateDoc(doc(db, 'library', id), patch);
}

/** Remove an exercise from the shared library. */
export async function deleteLibraryExercise(id: string): Promise<void> {
  await deleteDoc(doc(db, 'library', id));
}
