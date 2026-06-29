import { useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Dumbbell, ChevronUp, ChevronDown } from 'lucide-react';
import {
  useClientExercises,
  useRemoveProgramExercise,
  useReorderProgramExercises,
  useUpdateProgramExercise,
} from '../hooks/useData';
import { useToast } from './Toast';
import { muscleColor } from '../lib/muscleColors';
import { programDisplayName, parseDays, loadLabel } from '../domain/client';
import type { Client, ProgramExercise } from '../domain/types';

type Mode = 'view' | 'edit' | 'reorder';

// Current-program section: program meta + exercise list. Coaches can add exercises
// from the library, edit targets, remove, and reorder (↑/↓). Per-week loads live on
// a dedicated screen (Set loads).
export default function ProgramCard({ client }: { client: Client }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: exercises = [], isLoading } = useClientExercises(client.id);
  const remove = useRemoveProgramExercise(client.id);
  const update = useUpdateProgramExercise(client.id);
  const reorder = useReorderProgramExercises(client.id);

  const [mode, setMode] = useState<Mode>('view');
  const [targets, setTargets] = useState<Record<string, string>>({});
  // Optimistic order while reordering (null otherwise).
  const [order, setOrder] = useState<ProgramExercise[] | null>(null);

  const p = client.program;
  const days = parseDays(client.days);
  const list = exercises.filter((e) => !e.future && e.name !== 'Tap to add exercise');
  const display = mode === 'reorder' && order ? order : list;

  function leaveMode() {
    setMode('view');
    setOrder(null);
  }

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

  function move(i: number, dir: -1 | 1) {
    const arr = [...display];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setOrder(arr);
    reorder.mutate(
      arr.map((e) => e.id as string),
      { onError: () => { setOrder(null); toast('Could not reorder'); } },
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
              {display.map((ex, i) => {
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
                      {mode !== 'reorder' && load && <div className="lib-cat">Latest · {load}</div>}
                    </div>

                    {mode === 'edit' ? (
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
                    ) : mode === 'reorder' ? (
                      <div className="ex-edit">
                        <button className="stp-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                          <ChevronUp size={18} />
                        </button>
                        <button
                          className="stp-btn"
                          disabled={i === display.length - 1}
                          onClick={() => move(i, 1)}
                          aria-label="Move down"
                        >
                          <ChevronDown size={18} />
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
            {mode === 'view' ? (
              <>
                <button className="cp-link" onClick={() => navigate(`/clients/${client.id}/library`)}>
                  + Add exercise
                </button>
                {list.length > 0 && (
                  <button className="cp-link" onClick={() => navigate(`/clients/${client.id}/program`)}>
                    Set loads
                  </button>
                )}
                {list.length > 0 && (
                  <button className="cp-link" onClick={() => setMode('edit')}>
                    Edit
                  </button>
                )}
                {list.length > 1 && (
                  <button className="cp-link" onClick={() => { setMode('reorder'); setOrder(list); }}>
                    Reorder
                  </button>
                )}
              </>
            ) : (
              <button className="cp-link" onClick={leaveMode}>
                Done
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
