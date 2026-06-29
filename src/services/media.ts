// Client progress-photo reads. Photos are stored as compressed base64 in
// clients/{id}/media/{mediaId} (one per doc) — no external storage. Uploads
// (compress → write) come in a later mutation task.
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { Media } from '../domain/types';

export async function fetchMedia(clientId: string): Promise<Media[]> {
  const snap = await getDocs(collection(db, 'clients', clientId, 'media'));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Media, 'id'>) }))
    .sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
}
