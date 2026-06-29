// Client progress-photo data access. Photos are stored as compressed base64 in
// clients/{id}/media/{mediaId} (one per doc) — no external storage. Any coach may
// read/write (see firestore.rules: media allow read, write if isAuthed()).
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Media } from '../domain/types';

export async function fetchMedia(clientId: string): Promise<Media[]> {
  const snap = await getDocs(collection(db, 'clients', clientId, 'media'));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Media, 'id'>) }))
    .sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
}

/** A new progress photo: compressed base64 + kind + optional caption. */
export interface NewMedia {
  data: string; // base64 data URL (already compressed)
  kind: 'before' | 'progress';
  caption?: string;
}

/** Add a progress photo (stamped with createdAt). Any coach may upload. */
export async function addMedia(clientId: string, media: NewMedia): Promise<void> {
  const ref = doc(collection(db, 'clients', clientId, 'media'));
  const payload: Record<string, unknown> = {
    data: media.data,
    kind: media.kind,
    createdAt: new Date().toISOString(),
  };
  const caption = media.caption?.trim();
  if (caption) payload.caption = caption;
  await setDoc(ref, payload);
}

/** Delete one progress photo. */
export async function deleteMedia(clientId: string, mediaId: string): Promise<void> {
  await deleteDoc(doc(db, 'clients', clientId, 'media', mediaId));
}
