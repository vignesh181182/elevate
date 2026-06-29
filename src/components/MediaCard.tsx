import { Image as ImageIcon } from 'lucide-react';
import { useClientMedia } from '../hooks/useData';
import { useToast } from './Toast';
import { fmtShortDate } from '../lib/format';
import type { Client } from '../domain/types';

// Read-only progress photos. Real photos are compressed base64 stored per client
// (no fabricated placeholders) — empty until the coach uploads (a later task).
export default function MediaCard({ client }: { client: Client }) {
  const { data: photos = [], isLoading } = useClientMedia(client.id);
  const toast = useToast();

  return (
    <div className="cp-card">
      <div className="cp-sec">
        <div className="cp-sec-t">
          <ImageIcon size={16} className="t-pink" />
          Progress photos
        </div>
        <button className="cp-link" onClick={() => toast('Add photo — coming soon')}>
          + Add
        </button>
      </div>

      {isLoading ? (
        <div className="cl-loading">Loading photos…</div>
      ) : photos.length === 0 ? (
        <div className="ph-empty-inline">No progress photos yet — add one from a session.</div>
      ) : (
        <div className="cp-photos">
          {photos.map((m) => (
            <div className="cp-photo" key={m.id}>
              <img className="cp-photo-img media-img-fill" src={m.data} alt={m.caption ?? 'Progress photo'} />
              <div className="cp-photo-cap">
                {m.kind === 'before' ? 'Before' : 'Progress'}
                {m.createdAt ? ` · ${fmtShortDate(m.createdAt)}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
