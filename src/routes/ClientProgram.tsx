import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, History, Pencil } from 'lucide-react';
import { useClient, useClientExercises, useProgramHistory } from '../hooks/useData';
import ProgramHistory from '../components/ProgramHistory';
import { ROUNDS } from '../domain/session';
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

const fmtW = (w: number) => (Number.isInteger(w) ? `${w}` : w.toFixed(1));

// Read-only Program view. Browse any day / week / the full grid / history; editing
// happens on the dedicated header-less edit page (ClientProgramEdit), reached via the
// "Change / modify program" button — scoped to the day + week currently in view.
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
  return <ReadOnly key={client.id} client={client} list={list} history={history} navigate={navigate} />;
}

function ReadOnly({
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
  const weeks = client.program?.weeks ?? 6;
  const curWk = currentProgramWeek(client);
  const days = programDays(client);
  const perDay = hasDayProgPlan(list) && days.length > 0;

  const [mode, setMode] = useState<'current' | 'history'>('current');
  const [gridMode, setGridMode] = useState<'cards' | 'grid'>('cards');
  const [week, setWeek] = useState(curWk);
  const [day, setDay] = useState(() => (days.includes(todayWeekday()) ? todayWeekday() : days[0] ?? ''));

  function openEdit() {
    const q = new URLSearchParams();
    if (perDay && day) q.set('day', day);
    q.set('week', String(week));
    navigate(`/clients/${client.id}/program/edit?${q.toString()}`);
  }

  return (
    <div className="screen">
      <div className="bar solid">
        <button className="iconbtn" onClick={() => navigate(-1)} aria-label="Back">
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

          {list.length > 0 && (
            <div className="grid-toggle">
              <div className={`gt ${gridMode === 'cards' ? 'on' : ''}`} onClick={() => setGridMode('cards')}>
                Plan by week
              </div>
              <div className={`gt ${gridMode === 'grid' ? 'on' : ''}`} onClick={() => setGridMode('grid')}>
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
                {day === todayWeekday() ? ' · today' : ''} · Week {week}
              </div>
              {PROG_LABELS.map((prog) => (
                <ReadOnlySlot
                  key={prog}
                  prog={prog}
                  exercises={exForDayProg(list, day, prog)}
                  sets={client.program?.sets?.[prog] ?? ROUNDS}
                  week={week}
                />
              ))}
            </>
          ) : list.length === 0 ? (
            <div className="empty">
              <div className="em">🏋️</div>
              <p>No exercises yet. Tap below to build the program.</p>
            </div>
          ) : (
            list.map((ex) => <ReadOnlyExCard key={ex.id ?? ex.name} ex={ex} week={week} />)
          )}

          {gridMode === 'cards' && (
            <div className="bottom-cta sticky-cta">
              <button className="bigbtn" onClick={openEdit}>
                <Pencil size={18} /> Change / modify program
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// One read-only A/B program: name + exercise count + static set count, then each
// exercise with its planned weight/reps for the selected week (no edit controls).
function ReadOnlySlot({
  prog,
  exercises,
  sets,
  week,
}: {
  prog: ProgLabel;
  exercises: ProgramExercise[];
  sets: number;
  week: number;
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
            {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} · {sets} set{sets !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      {exercises.length ? (
        exercises.map((ex) => <ReadOnlyExCard key={ex.id ?? ex.name} ex={ex} week={week} />)
      ) : (
        <div className="slot-empty">No exercises in Program {prog} yet.</div>
      )}
    </div>
  );
}

// Read-only exercise card — name + the week's planned load as a subline
// ("12 Reps · 5kg Weights"). Rep/time exercises carry no external load.
function ReadOnlyExCard({ ex, week }: { ex: ProgramExercise; week: number }) {
  const rep = isRepBased(ex);
  const l = weekLoad(ex, week);
  const loadLabel = rep ? 'Bodyweight' : l.w > 0 ? `${fmtW(l.w)}kg Weights` : 'No weights';
  return (
    <div className="ex-card ro-ex">
      <div className="ex-top">
        <div className="ex-top-main">
          <div>
            <div className="ex-name">{ex.name}</div>
            <div className="ex-target">
              {l.r} Reps · {loadLabel}
            </div>
          </div>
        </div>
      </div>
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
