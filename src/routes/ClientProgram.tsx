import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, History } from 'lucide-react';
import {
  useClient,
  useClientExercises,
  useProgramHistory,
  useRemoveProgramExercise,
  useReorderProgramExercises,
  useSaveWeekLoads,
  useSetProgramSets,
} from '../hooks/useData';
import { useToast } from '../components/Toast';
import ProgramHistory from '../components/ProgramHistory';
import { MAX_SETS, MIN_SETS, ROUNDS } from '../domain/session';
import { currentProgramWeek, isRepBased, programDisplayName, weekLoad } from '../domain/client';
import {
  exForDayProg,
  hasDayProgPlan,
  programDays,
  PROG_LABELS,
  todayWeekday,
  type ProgLabel,
} from '../domain/program';
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
  const remove = useRemoveProgramExercise(client.id);
  const setSets = useSetProgramSets(client.id);
  const weeks = client.program?.weeks ?? 6;
  const curWk = currentProgramWeek(client);
  const days = programDays(client);
  const perDay = hasDayProgPlan(list) && days.length > 0;

  const [mode, setMode] = useState<'current' | 'history'>('current');
  const [gridMode, setGridMode] = useState<'cards' | 'grid'>('cards');
  const [reorderMode, setReorderMode] = useState(false);
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
        <button className="iconbtn" onClick={() => navigate(-1)} aria-label="Back">
          <ChevronLeft />
        </button>
        <div className="bar-title">
          {mode === 'history' ? 'Program history' : reorderMode ? 'Reorder exercises' : 'Program'}
        </div>
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
      ) : reorderMode ? (
        <Reorder client={client} list={list} weeks={weeks} onDone={() => setReorderMode(false)} />
      ) : (
        <>
          <div className="wkbanner pad-h">
            {programDisplayName(client.program)} · Week {week} of {weeks}
            {week === curWk ? ' · this week' : ''}
          </div>

          {list.length > 0 && (
            <div className="grid-toggle">
              <div
                className={`gt ${gridMode === 'cards' ? 'on' : ''}`}
                onClick={() => setGridMode('cards')}
              >
                Plan by week
              </div>
              <div
                className={`gt ${gridMode === 'grid' ? 'on' : ''}`}
                onClick={() => setGridMode('grid')}
              >
                Full {weeks}-week grid
              </div>
            </div>
          )}

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

          {gridMode === 'grid' ? (
            <FullGrid list={list} weeks={weeks} curWk={curWk} />
          ) : perDay ? (
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
                  sets={client.program?.sets?.[prog] ?? ROUNDS}
                  onSets={(delta) => {
                    const cur = client.program?.sets?.[prog] ?? ROUNDS;
                    const n = Math.max(MIN_SETS, Math.min(MAX_SETS, cur + delta));
                    if (n !== cur) setSets.mutate({ label: prog, n });
                  }}
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

          {list.length >= 2 && (
            <button className="ex-reorder-btn" onClick={() => setReorderMode(true)}>
              ↕ Reorder exercises
            </button>
          )}

          {gridMode === 'cards' && (
            <div className="bottom-cta sticky-cta">
              <button
                className={`bigbtn${!dirty || save.isPending ? ' dim' : ''}`}
                disabled={!dirty || save.isPending}
                onClick={onSave}
              >
                {save.isPending ? 'Saving…' : dirty ? `Save week ${week}` : 'No changes'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Read-only port of the prototype fullGrid(): exercises × weeks, showing each
// week's stored load (future weeks dimmed, the live week highlighted). No mutation.
function FullGrid({ list, weeks, curWk }: { list: ProgramExercise[]; weeks: number; curWk: number }) {
  const wkArr = Array.from({ length: weeks }, (_, i) => i + 1);
  return (
    <div className="fullgrid">
      <table>
        <thead>
          <tr>
            <th className="ex-h">Exercise</th>
            {wkArr.map((w) => (
              <th key={w} className={w === curWk ? 'nowcol' : ''}>
                W{w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((ex) => (
            <tr key={ex.id ?? ex.name}>
              <td className="ex">
                {ex.name}
                {ex.day && ex.prog && (
                  <span className="grid-tag">
                    {ex.day}·{ex.prog}
                  </span>
                )}
              </td>
              {wkArr.map((w) => {
                const l = ex.logs?.[w];
                return (
                  <td key={w} className={w === curWk ? 'nowcol' : ''}>
                    {l ? (
                      <>
                        <span className={`wt${w > curWk ? ' plan' : ''}`}>{l.w}</span>
                        <div className="rp">{l.r}r</div>
                      </>
                    ) : (
                      <span className="rp">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Drag-to-reorder, ported from the prototype wireReorder(): the grip starts a
// pointer drag, the row follows the finger and neighbours shift past midpoints
// (transforms set imperatively, as in the prototype — transient gesture state,
// not rendered markup). Order is committed once on "Done" via a batch write.
function Reorder({
  client,
  list,
  weeks,
  onDone,
}: {
  client: Client;
  list: ProgramExercise[];
  weeks: number;
  onDone: () => void;
}) {
  const toast = useToast();
  const reorder = useReorderProgramExercises(client.id);
  const [order, setOrder] = useState<ProgramExercise[]>(list);
  const rowEls = useRef<(HTMLDivElement | null)[]>([]);
  const drag = useRef({ active: false, from: -1, cur: -1, startY: 0, slotH: 0 });

  function begin(idx: number, e: React.PointerEvent) {
    e.preventDefault();
    const rows = rowEls.current;
    if (rows.length < 2) return;
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* setPointerCapture can throw on detached elements — safe to ignore */
    }
    const slotH = rows[1]!.getBoundingClientRect().top - rows[0]!.getBoundingClientRect().top;
    drag.current = { active: true, from: idx, cur: idx, startY: e.clientY, slotH };
    rows[idx]?.classList.add('reord-drag');
  }

  function move(e: React.PointerEvent) {
    const d = drag.current;
    if (!d.active) return;
    const rows = rowEls.current;
    const el = rows[d.from];
    if (!el) return;
    const dy = Math.max(-d.from * d.slotH, Math.min((rows.length - 1 - d.from) * d.slotH, e.clientY - d.startY));
    el.style.transform = `translateY(${dy}px)`;
    const ni = Math.max(0, Math.min(rows.length - 1, d.from + Math.round(dy / d.slotH)));
    if (ni !== d.cur) {
      d.cur = ni;
      rows.forEach((r, k) => {
        if (!r || k === d.from) return;
        let s = 0;
        if (d.from < ni && k > d.from && k <= ni) s = -d.slotH;
        else if (d.from > ni && k >= ni && k < d.from) s = d.slotH;
        r.style.transform = s ? `translateY(${s}px)` : '';
      });
    }
  }

  function end() {
    const d = drag.current;
    if (!d.active) return;
    drag.current = { active: false, from: -1, cur: -1, startY: 0, slotH: 0 };
    rowEls.current.forEach((r) => {
      if (r) {
        r.style.transform = '';
        r.classList.remove('reord-drag');
      }
    });
    if (d.cur !== d.from && d.cur >= 0) {
      setOrder((prev) => {
        const a = [...prev];
        a.splice(d.cur, 0, a.splice(d.from, 1)[0]);
        return a;
      });
    }
  }

  function onDoneClick() {
    const ids = order.map((e) => e.id).filter((x): x is string => !!x);
    const unchanged = ids.length === list.length && ids.every((id, i) => id === list[i].id);
    if (unchanged) {
      onDone();
      return;
    }
    reorder.mutate(ids, {
      onSuccess: () => {
        toast('Exercise order saved');
        onDone();
      },
      onError: () => toast('Could not save order'),
    });
  }

  return (
    <>
      <div className="scr-head">
        <div className="scr-head-t">Reorder exercises</div>
        <div className="scr-head-s">
          {client.name.split(' ')[0]}&rsquo;s program · {order.length} exercise{order.length !== 1 ? 's' : ''}
        </div>
      </div>
      <div className="reord-banner">
        Press the ⠿ handle and drag an exercise up or down. This order applies across all {weeks} weeks.
      </div>
      <div>
        {order.map((ex, i) => (
          <div key={ex.id ?? ex.name} className="reord-row" ref={(el) => void (rowEls.current[i] = el)}>
            <div className="reord-main">
              <div className="reord-name">{ex.name}</div>
              <div className="reord-target">
                {ex.day && ex.prog ? `${ex.day} · Program ${ex.prog} · ` : ''}Target {ex.target}
              </div>
            </div>
            <div
              className="reord-grip"
              aria-label="Drag to reorder"
              onPointerDown={(e) => begin(i, e)}
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={end}
            >
              ⠿
            </div>
          </div>
        ))}
      </div>
      <div className="bottom-cta">
        <button className={`bigbtn${reorder.isPending ? ' dim' : ''}`} disabled={reorder.isPending} onClick={onDoneClick}>
          {reorder.isPending ? 'Saving…' : '✓ Done'}
        </button>
      </div>
    </>
  );
}

function Slot({
  prog,
  exercises,
  renderCard,
  sets,
  onSets,
  onAdd,
}: {
  prog: ProgLabel;
  exercises: ProgramExercise[];
  renderCard: (ex: ProgramExercise) => React.ReactNode;
  sets: number;
  onSets: (delta: number) => void;
  onAdd: () => void;
}) {
  return (
    <div className={`pgrp pgrp-${prog.toLowerCase()}`}>
      <div className="pgrp-bhead">
        <div className="pgrp-bid">
          <div className="pgrp-brow">
            <span className="pgrp-dot" />
            <span className="pgrp-name">Program {prog}</span>
          </div>
          <span className="pgrp-bcount">
            {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="pgrp-sets">
          <span className="pb-sets-lbl">No. of Sets</span>
          <div className="pb-stepper">
            <button className="pb-step" onClick={() => onSets(-1)} aria-label="Fewer sets">
              −
            </button>
            <span className="pb-stepval">{sets}</span>
            <button className="pb-step" onClick={() => onSets(1)} aria-label="More sets">
              +
            </button>
          </div>
        </div>
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
