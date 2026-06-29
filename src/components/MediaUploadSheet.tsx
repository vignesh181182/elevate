import { useState } from 'react';
import { useAddMedia } from '../hooks/useData';
import { useToast } from './Toast';

// Bottom-sheet to confirm a progress-photo upload: preview the compressed image,
// pick Before/Progress, add an optional caption, then save.
export default function MediaUploadSheet({
  clientId,
  dataUrl,
  onClose,
}: {
  clientId: string;
  dataUrl: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const add = useAddMedia(clientId);
  const [kind, setKind] = useState<'before' | 'progress'>('progress');
  const [caption, setCaption] = useState('');

  function onSave() {
    add.mutate(
      { data: dataUrl, kind, caption },
      {
        onSuccess: () => {
          toast('Photo added');
          onClose();
        },
        onError: () => toast('Could not save photo'),
      },
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">Add progress photo</div>

        <div className="field">
          <img className="media-preview" src={dataUrl} alt="Photo preview" />
        </div>

        <div className="field">
          <label>Type</label>
          <div className="seg">
            <button type="button" className={kind === 'before' ? 'on' : ''} onClick={() => setKind('before')}>
              Before
            </button>
            <button type="button" className={kind === 'progress' ? 'on' : ''} onClick={() => setKind('progress')}>
              Progress
            </button>
          </div>
        </div>

        <div className="field">
          <label>Caption (optional)</label>
          <input placeholder="e.g. Week 6 · side" value={caption} onChange={(e) => setCaption(e.target.value)} />
        </div>

        <div className="bottom-cta cta-row">
          <button type="button" className="bigbtn ghost" onClick={onClose} disabled={add.isPending}>
            Cancel
          </button>
          <button type="button" className={`bigbtn${add.isPending ? ' dim' : ''}`} disabled={add.isPending} onClick={onSave}>
            {add.isPending ? 'Saving…' : 'Save photo'}
          </button>
        </div>
      </div>
    </div>
  );
}
