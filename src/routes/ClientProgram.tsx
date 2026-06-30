import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, History } from 'lucide-react';
import {
  useClient,
  useClientExercises,
  useProgramHistory,
  useRemoveProgramExercise,
  useSaveWeekLoads,
} from '../hooks/useData';
import { useToast } from '../components/Toast';
import ProgramHistory from '../components/ProgramHistory';
import { currentProgramWeek, isRepBased, programDisplayName, weekLoad } from '../domain/client';
import { exForDayProg, hasDayProgPlan, programDays, PROG_LABELS, type ProgLabel } from '../domain/program';
import type { Client, ProgramExercise, ProgramHistory as ProgramHistoryRec } from '../domain/types';

const round1 = (n: number) => Math.round(n * 10) / 10;
const todayWeekday = () => new Date().toLocaleDateString('en-US', { weekday: 'short' });

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
  const remove = useRemoveProgramExercise(client.id);
  const weeks = client.program?.weeks ?? 6;
  const curWk = currentProgramWeek(client);
  const days = programDays(client);
  const perDay = hasDayProgPlan(list) && days.length > 0;

  const [mode, setMode] = useState<'current' | 'history'>('current');
  const [week, setWeek] = useState(curWk);
  const [day, setDay] = useState(() => (days.includes(todayWeekday()) ? todayWeekday() : days[0] ?? ''));
  // Unsaved edits, keyed by week → exId → {w,r}. Carry-forward defaults come from weekLoad.
  const [drafts, setDrafts] = useState<Record<number, Record<string, { w: number; r: number }>>>({});

  const valueFor = (ex: ProgramExercise) => drafts[week]?.[ex.id as string] ?? weekLoad(ex, week);

  function adjust(ex: ProgramExercise, k: 'w' | 'r', delta: number) {
    if (!ex.id) return;
    const cur = valueFor(ex);
    const next = { ...cur, [k]: Math.max(0, round1(cur[k] + delta)) };
    setDrafts((prev) => ({ ...prev, [week]: { ...prev[week], [ex.id as string]: next } }));
  }

  function onRemove(ex: ProgramExercise) {
    if (!ex.id) return;
    remove.mutate(ex.id, {
      onSuccess: () => toast(`${ex.name} removed`),
      onError: () => toast('Could not remove exercise'),
    });
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

  const card = (ex: ProgramExercise) => (
    <ExerciseCard key={ex.id ?? ex.name} ex={ex} v={valueFor(ex)} onAdjust={adjust} onRemove={onRemove} />
  );

  return (
    <div className="screen">
      <div className="bar solid">
        <button className="iconbtn" onClick={() => navigate(`/clients/${client.id}`)} aria-label="Back">
          <ChevronLeft />
        </button>
        <div className="bar-title">{mode === 'history' ? 'Program history' : 'Program'}</div>
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
            {week === curWk ? ' · this week' : ''}
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

          {perDay ? (
            <>
              <div className="day-tabs">
                {days.map((d) => (
                  <button key={d} className={`day-tab ${d === day ? 'on' : ''}`} onClick={() => setDay(d)}>
                    {d}
                    {d === todayWeekday() && <span className="day-today">today</span>}
                  </button>
                ))}
              </div>
              <div className="wkbanner">
                {day}
                {day === todayWeekday() ? ' · today' : ''} · Week {week} — tap − / + to set this week&rsquo;s load
              </div>
              {PROG_LABELS.map((prog) => (
                <Slot
                  key={prog}
                  prog={prog}
                  exercises={exForDayProg(list, day, prog)}
                  renderCard={card}
                  onAdd={() => navigate(`/clients/${client.id}/library?day=${day}&prog=${prog}`)}
                />
              ))}
            </>
          ) : list.length === 0 ? (
            <div className="empty">
              <div className="em">🏋️</div>
              <p>No exercises yet. Add some from the library first.</p>
              <button className="ex-add-btn" onClick={() => navigate(`/clients/${client.id}/library`)}>
                ＋ Add from exercise library
              </button>
            </div>
          ) : (
            <>
              {list.map(card)}
              <button className="ex-add-btn" onClick={() => navigate(`/clients/${client.id}/library`)}>
                ＋ Add from exercise library
              </button>
            </>
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

function Slot({
  prog,
  exercises,
  renderCard,
  onAdd,
}: {
  prog: ProgLabel;
  exercises: ProgramExercise[];
  renderCard: (ex: ProgramExercise) => React.ReactNode;
  onAdd: () => void;
}) {
  return (
    <div className="pgrp">
      <div className={`pgrp-head pgrp-${prog.toLowerCase()}`}>
        <span className="pgrp-dot" />
        <span className="pgrp-name">Program {prog}</span>
        <span className="pgrp-count">
          {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
        </span>
      </div>
      {exercises.length ? (
        exercises.map(renderCard)
      ) : (
        <div className="slot-empty">No exercises in Program {prog} yet — add some below.</div>
      )}
      <button className="slot-add" onClick={onAdd}>
        ＋ Add exercise to Program {prog}
      </button>
    </div>
  );
}

function ExerciseCard({
  ex,
  v,
  onAdjust,
  onRemove,
}: {
  ex: ProgramExercise;
  v: { w: number; r: number };
  onAdjust: (ex: ProgramExercise, k: 'w' | 'r', delta: number) => void;
  onRemove: (ex: ProgramExercise) => void;
}) {
  const rep = isRepBased(ex);
  return (
    <div className="ex-card">
      <div className="ex-top">
        <div>
          <div className="ex-name">{ex.name}</div>
          <div className="ex-target">Target {ex.target}</div>
        </div>
        <button className="ex-remove" onClick={() => onRemove(ex)} aria-label="Remove">
          ✕
        </button>
      </div>
      <div className="stepper-row">
        <div className="stepper">
          <div className="lbl">{rep ? 'Level/time' : 'Weight'}</div>
          <div className="ctl">
            <button className="stp-btn" onClick={() => onAdjust(ex, 'w', -2.5)} aria-label="Decrease weight">
              −
            </button>
            <div className="stp-val">
              {v.w}
              {rep ? '' : <small> kg</small>}
            </div>
            <button className="stp-btn" onClick={() => onAdjust(ex, 'w', 2.5)} aria-label="Increase weight">
              +
            </button>
          </div>
        </div>
        <div className="stepper">
          <div className="lbl">Reps</div>
          <div className="ctl">
            <button className="stp-btn" onClick={() => onAdjust(ex, 'r', -1)} aria-label="Decrease reps">
              −
            </button>
            <div className="stp-val">{v.r}</div>
            <button className="stp-btn" onClick={() => onAdjust(ex, 'r', 1)} aria-label="Increase reps">
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
