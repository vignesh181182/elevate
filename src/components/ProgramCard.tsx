import type { CSSProperties } from 'react';
import { ClipboardList, Dumbbell } from 'lucide-react';
import { useClientExercises } from '../hooks/useData';
import { muscleColor } from '../lib/muscleColors';
import { programDisplayName, parseDays, loadLabel } from '../domain/client';
import type { Client } from '../domain/types';

// Read-only current-program section: program meta + exercise list (name, group
// tag, latest logged load, target). Day/week planning and load editing are
// separate (later) tasks.
export default function ProgramCard({ client }: { client: Client }) {
  const { data: exercises = [], isLoading } = useClientExercises(client.id);
  const p = client.program;
  const days = parseDays(client.days);
  const list = exercises.filter((e) => !e.future && e.name !== 'Tap to add exercise');

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
                    <span className="lib-target">{ex.target}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
