import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, History } from 'lucide-react';
import { useClient, useClientExercises, useProgramHistory, useSaveWeekLoads } from '../hooks/useData';
import { useToast } from '../components/Toast';
import ProgramHistory from '../components/ProgramHistory';
import { currentProgramWeek, isRepBased, programDisplayName, weekLoad } from '../domain/client';
import type { Client, ProgramExercise, ProgramHistory as ProgramHistoryRec } from '../domain/types';

const round1 = (n: number) => Math.round(n * 10) / 10;

export default function ClientProgram() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: client, isLoading } = useClient(id);
  const { data: exercises = [] } = useClientExercises(id);
  const { data: history = [] } = useProgramHistory(id);

  if (isLoading || !client) {
    return (
      <div className="screen">
        <div className="cl-loading">Loading…</div>
      </div>
    );
  }
  const list = exercises.filter((e) => !e.future && e.name !== 'Tap to add exercise');
  return <Editor key={client.id} client={client} list={list} history={history} navigate={navigate} />;
}

function Editor({
  client,
  list,
  history,
  navigate,
}: {
  client: Client;
  list: ProgramExercise[];
  history: ProgramHistoryRec[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const toast = useToast();
  const save = useSaveWeekLoads(client.id);
  const weeks = client.program?.weeks ?? 6;
  const curWk = currentProgramWeek(client);

  const [mode, setMode] = useState<'current' | 'history'>('current');
  const [week, setWeek] = useState(curWk);
  // Unsaved edits, keyed by week → exId → {w,r}. Carry-forward defaults come from weekLoad.
  const [drafts, setDrafts] = useState<Record<number, Record<string, { w: number; r: number }>>>({});

  const valueFor = (ex: ProgramExercise) => drafts[week]?.[ex.id as string] ?? weekLoad(ex, week);

  function adjust(ex: ProgramExercise, k: 'w' | 'r', delta: number) {
    if (!ex.id) return;
    const cur = valueFor(ex);
    const next = { ...cur, [k]: Math.max(0, round1(cur[k] + delta)) };
    setDrafts((prev) => ({ ...prev, [week]: { ...prev[week], [ex.id as string]: next } }));
  }

  const weekDrafts = drafts[week] ?? {};
  const dirty = Object.keys(weekDrafts).length > 0;

  function onSave() {
    const loads = Object.entries(weekDrafts).map(([exId, v]) => ({ exId, w: v.w, r: v.r }));
    if (!loads.length) return;
    save.mutate(
      { week, loads },
      {
        onSuccess: () => {
          setDrafts((prev) => {
            const next = { ...prev };
            delete next[week];
            return next;
          });
          toast(`Week ${week} loads saved`);
        },
        onError: () => toast('Could not save loads'),
      },
    );
  }

  return (
    <div className="screen">
      <div className="bar solid">
        <button className="iconbtn" onClick={() => navigate(`/clients/${client.id}`)} aria-label="Back">
          <ChevronLeft />
        </button>
        <div className="bar-title">{mode === 'history' ? 'Program history' : 'Program loads'}</div>
        <button
          className={`iconbtn${mode === 'history' ? ' on' : ''}`}
          onClick={() => setMode((m) => (m === 'history' ? 'current' : 'history'))}
          aria-label={mode === 'history' ? 'Back to current program' : 'View program history'}
        >
          <History />
        </button>
      </div>

      {mode === 'history' ? (
        <ProgramHistory client={client} exercises={list} history={history} />
      ) : (
        <>
      <div className="wkbanner pad-h">
        {programDisplayName(client.program)} · Week {week} of {weeks}
        {week === curWk ? ' · this week' : ''} — tap − / + to set the load
      </div>

      <div className="weeks">
        {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => {
          const cls = w === week ? 'cur' : w < curWk ? 'done' : w === curWk ? 'current' : 'plan';
          return (
            <button key={w} className={`wk ${cls}`} onClick={() => setWeek(w)}>
              <small>Wk</small>
              {w}
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <div className="em">🏋️</div>
          <p>No exercises yet. Add some from the library first.</p>
        </div>
      ) : (
        list.map((ex) => {
          const v = valueFor(ex);
          const rep = isRepBased(ex);
          return (
            <div className="ex-card" key={ex.id ?? ex.name}>
              <div className="ex-top">
                <div>
                  <div className="ex-name">{ex.name}</div>
                  <div className="ex-target">Target {ex.target}</div>
                </div>
              </div>
              <div className="stepper-row">
                <div className="stepper">
                  <div className="lbl">{rep ? 'Level/time' : 'Weight'}</div>
                  <div className="ctl">
                    <button className="stp-btn" onClick={() => adjust(ex, 'w', -2.5)} aria-label="Decrease weight">
                      −
                    </button>
                    <div className="stp-val">
                      {v.w}
                      {rep ? '' : <small> kg</small>}
                    </div>
                    <button className="stp-btn" onClick={() => adjust(ex, 'w', 2.5)} aria-label="Increase weight">
                      +
                    </button>
                  </div>
                </div>
                <div className="stepper">
                  <div className="lbl">Reps</div>
                  <div className="ctl">
                    <button className="stp-btn" onClick={() => adjust(ex, 'r', -1)} aria-label="Decrease reps">
                      −
                    </button>
                    <div className="stp-val">{v.r}</div>
                    <button className="stp-btn" onClick={() => adjust(ex, 'r', 1)} aria-label="Increase reps">
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      <div className="bottom-cta sticky-cta">
        <button
          className={`bigbtn${!dirty || save.isPending ? ' dim' : ''}`}
          disabled={!dirty || save.isPending}
          onClick={onSave}
        >
          {save.isPending ? 'Saving…' : dirty ? `Save week ${week}` : 'No changes'}
        </button>
      </div>
        </>
      )}
    </div>
  );
}
