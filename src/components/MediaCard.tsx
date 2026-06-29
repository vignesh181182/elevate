import { useRef, useState, type ChangeEvent } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useClientMedia, useDeleteMedia } from '../hooks/useData';
import { useToast } from './Toast';
import MediaUploadSheet from './MediaUploadSheet';
import { compressImage } from '../lib/image';
import { fmtShortDate } from '../lib/format';
import type { Client } from '../domain/types';

// Progress photos: upload (compress → base64) and delete. Real photos only — no
// fabricated placeholders — stored per client in clients/{id}/media.
export default function MediaCard({ client }: { client: Client }) {
  const { data: photos = [], isLoading } = useClientMedia(client.id);
  const remove = useDeleteMedia(client.id);
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [pending, setPending] = useState<string | null>(null); // compressed data URL awaiting confirm
  const [compressing, setCompressing] = useState(false);
  const [editing, setEditing] = useState(false);

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    setCompressing(true);
    try {
      setPending(await compressImage(file));
    } catch {
      toast('Could not process that image');
    } finally {
      setCompressing(false);
    }
  }

  function onDelete(id: string) {
    remove.mutate(id, {
      onSuccess: () => toast('Photo removed'),
      onError: () => toast('Could not remove photo'),
    });
  }

  return (
    <div className="cp-card">
      <div className="cp-sec">
        <div className="cp-sec-t">
          <ImageIcon size={16} className="t-pink" />
          Progress photos
        </div>
        <button className="cp-link" onClick={() => fileRef.current?.click()} disabled={compressing}>
          {compressing ? 'Processing…' : '+ Add'}
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />

      {isLoading ? (
        <div className="cl-loading">Loading photos…</div>
      ) : photos.length === 0 ? (
        <div className="ph-empty-inline">No progress photos yet — tap + Add to upload one.</div>
      ) : (
        <>
          <div className="cp-photos">
            {photos.map((m) => (
              <div className="cp-photo" key={m.id}>
                <img className="cp-photo-img media-img-fill" src={m.data} alt={m.caption ?? 'Progress photo'} />
                {editing && (
                  <button className="cp-photo-rm" onClick={() => onDelete(m.id as string)} aria-label="Remove photo">
                    ✕
                  </button>
                )}
                <div className="cp-photo-cap">
                  {m.kind === 'before' ? 'Before' : 'Progress'}
                  {m.createdAt ? ` · ${fmtShortDate(m.createdAt)}` : ''}
                </div>
              </div>
            ))}
          </div>

          <div className="cp-actions">
            <button className="cp-link" onClick={() => setEditing((v) => !v)}>
              {editing ? 'Done' : 'Edit'}
            </button>
          </div>
        </>
      )}

      {pending && <MediaUploadSheet clientId={client.id} dataUrl={pending} onClose={() => setPending(null)} />}
    </div>
  );
}
