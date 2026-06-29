// Client data-access layer (Firestore reads). Per the access model, ALL coaches
// see ALL clients — only payment data is gated (see services/payments.ts +
// firestore.rules). So these reads are not coach-filtered.
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import type { Client, ProgramExercise, ProgramHistory } from '../domain/types';

export async function fetchClients(): Promise<Client[]> {
  const snap = await getDocs(query(collection(db, 'clients'), orderBy('name')));
  return snap.docs.map((d) => d.data() as Client);
}

export async function fetchClient(id: string): Promise<Client | null> {
  const snap = await getDoc(doc(db, 'clients', id));
  return snap.exists() ? (snap.data() as Client) : null;
}

export async function fetchClientExercises(id: string): Promise<ProgramExercise[]> {
  const snap = await getDocs(query(collection(db, 'clients', id, 'exercises'), orderBy('order')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ProgramExercise, 'id'>) }));
}

export async function fetchProgramHistory(id: string): Promise<ProgramHistory[]> {
  const snap = await getDocs(collection(db, 'clients', id, 'programHistory'));
  return snap.docs
    .map((d) => d.data() as ProgramHistory)
    .sort((a, b) => a.no - b.no);
}
