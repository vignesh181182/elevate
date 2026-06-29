import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { useDeleteLibraryExercise, useSaveLibraryExercise } from '../hooks/useData';
import { useToast } from './Toast';
import { LIB_GROUPS } from '../lib/muscleColors';
import type { LibraryExercise } from '../domain/types';

const GROUPS = LIB_GROUPS.filter((g) => g !== 'All');

// Bottom-sheet to add a new shared library exercise or edit/delete an existing one.
// Any coach may edit the catalog (rules allow library writes).
export default function LibraryForm({
  editing,
  existing,
  onClose,
}: {
  editing: LibraryExercise | null;
  existing: LibraryExercise[];
  onClose: () => void;
}) {
  const toast = useToast();
  const save = useSaveLibraryExercise();
  const del = useDeleteLibraryExercise();
  const busy = save.isPending || del.isPending;

  const [name, setName] = useState(editing?.name ?? '');
  const [group, setGroup] = useState(editing?.group ?? '');
  const [category, setCategory] = useState(editing?.category ?? '');
  const [target, setTarget] = useState(editing?.target ?? '');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return toast('Exercise needs a name');
    if (!group) return toast('Pick a muscle group');
    const dupe = existing.some((x) => x.id !== editing?.id && x.name.trim().toLowerCase() === n.toLowerCase());
    if (dupe) return toast(`"${n}" is already in the library`);

    const input = { name: n, group, category: category.trim() || group, target: target.trim() || '3×10' };
    save.mutate(
      { id: editing?.id, input },
      {
        onSuccess: () => {
          toast(editing ? 'Exercise updated' : `Added ${n}`);
          onClose();
        },
        onError: () => toast('Could not save exercise'),
      },
    );
  }

  function onDelete() {
    if (!editing?.id) return;
    del.mutate(editing.id, {
      onSuccess: () => {
        toast(`Removed ${editing.name}`);
        onClose();
      },
      onError: () => toast('Could not remove exercise'),
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">{editing ? 'Edit exercise' : 'Add new exercise'}</div>

        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Exercise name</label>
            <input placeholder="e.g. Landmine press" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="field">
            <label>Muscle group</label>
            <div className="selectwrap">
              <select value={group} onChange={(e) => setGroup(e.target.value)}>
                <option value="" disabled>
                  Select muscle group…
                </option>
                {GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Category (optional)</label>
            <input
              placeholder="e.g. Push · compound"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Default target</label>
            <input placeholder="e.g. 3×10" value={target} onChange={(e) => setTarget(e.target.value)} />
          </div>

          <div className="bottom-cta cta-row">
            {editing ? (
              <button type="button" className="bigbtn ghost" onClick={onDelete} disabled={busy} aria-label="Delete exercise">
                <Trash2 size={18} />
              </button>
            ) : (
              <button type="button" className="bigbtn ghost" onClick={onClose} disabled={busy}>
                Cancel
              </button>
            )}
            <button type="submit" className={`bigbtn${busy ? ' dim' : ''}`} disabled={busy}>
              {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Add exercise'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
