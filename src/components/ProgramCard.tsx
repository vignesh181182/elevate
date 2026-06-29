import { useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Dumbbell } from 'lucide-react';
import { useClientExercises, useRemoveProgramExercise, useUpdateProgramExercise } from '../hooks/useData';
import { useToast } from './Toast';
import { muscleColor } from '../lib/muscleColors';
import { programDisplayName, parseDays, loadLabel } from '../domain/client';
import type { Client, ProgramExercise } from '../domain/types';

// Current-program section: program meta + exercise list (name, group tag, latest
// logged load, target). Coaches can add exercises from the library and, in edit
// mode, remove them. Per-week load editing & reorder are separate (later) tasks.
export default function ProgramCard({ client }: { client: Client }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: exercises = [], isLoading } = useClientExercises(client.id);
  const remove = useRemoveProgramExercise(client.id);
  const update = useUpdateProgramExercise(client.id);
  const [editing, setEditing] = useState(false);
  // Per-exercise target draft while editing; absent ⇒ show the stored value.
  const [targets, setTargets] = useState<Record<string, string>>({});

  const p = client.program;
  const days = parseDays(client.days);
  const list = exercises.filter((e) => !e.future && e.name !== 'Tap to add exercise');

  function onRemove(ex: ProgramExercise) {
    if (!ex.id) return;
    remove.mutate(ex.id, {
      onSuccess: () => toast(`Removed ${ex.name}`),
      onError: () => toast('Could not remove exercise'),
    });
  }

  function commitTarget(ex: ProgramExercise) {
    if (!ex.id) return;
    const next = (targets[ex.id] ?? ex.target).trim();
    if (!next || next === ex.target) return;
    update.mutate(
      { exId: ex.id, patch: { target: next } },
      { onSuccess: () => toast('Target updated'), onError: () => toast('Could not update target') },
    );
  }

  return (
    <div className="cp-card">
      <div className="cp-sec">
        <div className="cp-sec-t">
          <ClipboardList size={16} className="t-purple" />
          Program
        </div>
        {p && <span className="tag">{p.weeks}-week block</span>}
      </div>

      {!p ? (
        <div className="cp-about-v">No active program yet.</div>
      ) : (
        <>
          <div className="cp-about-v">{programDisplayName(p)}</div>
          <div className="cp-about-k">
            {days.length ? days.join(' / ') : 'No training days set'} · {p.done} session{p.done === 1 ? '' : 's'} done
          </div>

          {isLoading ? (
            <div className="cl-loading cp-hist-h">Loading exercises…</div>
          ) : list.length === 0 ? (
            <div className="cp-about-v cp-hist-h">No exercises in this program yet.</div>
          ) : (
            <div className="cp-hist-h">
              {list.map((ex) => {
                const mc = muscleColor(ex.group ?? '');
                const tagStyle = { '--c-bg': mc.b, '--c-fg': mc.c } as CSSProperties;
                const load = loadLabel(ex);
                return (
                  <div className="lib-row" key={ex.id ?? ex.name}>
                    <div className="lib-ic">
                      <Dumbbell size={18} />
                    </div>
                    <div className="lib-main">
                      <div className="lib-name-row">
                        <span className="lib-name">{ex.name}</span>
                        {ex.group && (
                          <span className="lib-mg tint-cat" style={tagStyle}>
                            {ex.group}
                          </span>
                        )}
                      </div>
                      {load && <div className="lib-cat">Latest · {load}</div>}
                    </div>
                    {editing ? (
                      <div className="ex-edit">
                        <input
                          className="ex-target-input"
                          value={ex.id ? targets[ex.id] ?? ex.target : ex.target}
                          onChange={(e) =>
                            ex.id && setTargets((t) => ({ ...t, [ex.id as string]: e.target.value }))
                          }
                          onBlur={() => commitTarget(ex)}
                          aria-label={`Target for ${ex.name}`}
                        />
                        <button
                          className="ex-remove"
                          onClick={() => onRemove(ex)}
                          disabled={remove.isPending}
                          aria-label={`Remove ${ex.name}`}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span className="lib-target">{ex.target}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="cp-actions">
            <button className="cp-link" onClick={() => navigate(`/clients/${client.id}/library`)}>
              + Add exercise
            </button>
            {list.length > 0 && (
              <button className="cp-link" onClick={() => setEditing((v) => !v)}>
                {editing ? 'Done' : 'Edit'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
