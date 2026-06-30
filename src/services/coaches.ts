// Coach reads + own-profile writes. The coaches collection is readable by any signed-in
// coach; a coach may WRITE only their own doc (rules: uid == coachId, or main).
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Coach } from '../domain/types';

export async function fetchCoaches(): Promise<Coach[]> {
  const snap = await getDocs(collection(db, 'coaches'));
  return snap.docs.map((d) => d.data() as Coach);
}

/** Editable own-profile fields. */
export interface CoachProfilePatch {
  name: string;
  phone: string;
  email: string;
  tagline: string;
}

/** Update the signed-in coach's own profile doc (coaches/{uid}). */
export async function saveCoachProfile(uid: string, patch: CoachProfilePatch): Promise<void> {
  await updateDoc(doc(db, 'coaches', uid), { ...patch });
}
