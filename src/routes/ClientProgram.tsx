import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, History, Pencil } from 'lucide-react';
import { useClient, useClientExercises, useProgramHistory, useClientSessionLog } from '../hooks/useData';
import ProgramHistory from '../components/ProgramHistory';
import { fmtShortDate, fmtProgRange } from '../lib/format';
import { sessionsInRange } from '../domain/session';
import { ROUNDS } from '../domain/session';
import { currentProgramWeek, isRepBased, weekLoad } from '../domain/client';
import {
  dayProgLabels,
  exForDayProg,
  hasDayProgPlan,
  programDays,
  todayWeekday,
  type ProgLabel,
} from '../domain/program';
import type { Client, ProgramExercise, ProgramHistory as ProgramHistoryRec, SessionLog } from '../domain/types';

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
  const { data: log = [] } = useClientSessionLog(id);
  const [sp] = useSearchParams();
  const historyNo = sp.get('history');

  if (isLoading || !client) {
    return (
      <div className="screen">
        <div className="cl-loading">Loading…</div>
      </div>
    );
  }
  const list = exercises.filter((e) => !e.future && e.name !== 'Tap to add exercise');

  // ?history=<no> opens a past program's read-only detail (same landing-page shell),
  // scoped to that archived program and its completed sessions.
  if (historyNo != null) {
    const rec = history.find((h) => String(h.no) === historyNo);
    if (rec) {
      return (
        <PastProgram
          key={rec.no}
          client={client}
          rec={rec}
          sessions={sessionsInRange(log, rec.startDate, rec.endDate)}
          navigate={navigate}
        />
      );
    }
  }

  return <ReadOnly key={client.id} client={client} list={list} history={history} log={log} navigate={navigate} />;
}

// Read-only detail for an archived program — reuses the program landing-page shell
// (bar + exercise cards), then lists every completed session logged during the program's
// date range; each session row opens that day's read-only session.
function PastProgram({
  client,
  rec,
  sessions,
  navigate,
}: {
  client: Client;
  rec: ProgramHistoryRec;
  sessions: SessionLog[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const total = rec.weeks * rec.perWeek;
  return (
    <div className="screen">
      <div className="bar solid">
        <button className="iconbtn" onClick={() => navigate(-1)} aria-label="Back">
          <ChevronLeft />
        </button>
        <div className="bar-titles">
          <div className="bar-title">{rec.name}</div>
          <div className="bar-sub">
            {client.name} · Program #{rec.no}
          </div>
        </div>
      </div>

      <div className="ph-card pad-card">
        <div className="ph-range">{fmtProgRange(rec.startDate, rec.endDate)}</div>
        <div className="ph-stats">
          {rec.weeks} weeks · {rec.perWeek}/week · {rec.sessionsCompleted} of {total} sessions completed
        </div>
        {rec.notes && <div className="ph-notes">{rec.notes}</div>}
      </div>

      <div className="ph-detail-sec">Exercises</div>
      {rec.exercises.length ? (
        rec.exercises.map((ex, i) => (
          <div className="ex-card ro-ex" key={`${ex.name}-${i}`}>
            <div className="ex-top">
              <div className="ex-top-main">
                <div>
                  <div className="ex-name">{ex.name}</div>
                  <div className="ex-target">{ex.target || '—'}</div>
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="ph-empty-inline">No exercises recorded for this program.</div>
      )}

      <div className="ph-detail-sec">Sessions</div>
      {sessions.length ? (
        <div className="ph-sess-list pad">
          {sessions.map((s) => (
            <button
              className="ph-sess-row"
              key={s.date}
              onClick={() => navigate(`/clients/${client.id}/session?date=${s.date}`)}
            >
              <span className="ph-sess-date">{fmtShortDate(s.date)}</span>
              <span className="ph-sess-meta">
                {s.roundsCompleted}/{s.totalRounds} rounds{s.early ? ' · ended early' : ''}
              </span>
              <ChevronRight size={15} className="ph-sess-chev" />
            </button>
          ))}
        </div>
      ) : (
        <div className="ph-empty-inline">No completed sessions were logged for this program.</div>
      )}

      <div className="sp24" />
    </div>
  );
}

function ReadOnly({
  client,
  list,
  history,
  log,
  navigate,
}: {
  client: Client;
  list: ProgramExercise[];
  history: ProgramHistoryRec[];
  log: SessionLog[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const weeks = client.program?.weeks ?? 6;
  const curWk = currentProgramWeek(client);
  const days = programDays(client);
  const perDay = hasDayProgPlan(list) && days.length > 0;

  // History mode lives in the URL (?view=history) so opening a past program and pressing
  // back returns to the history list rather than resetting to the current program.
  const [sp, setSp] = useSearchParams();
  const mode = sp.get('view') === 'history' ? 'history' : 'current';
  const toggleMode = () => {
    const p = new URLSearchParams(sp);
    if (mode === 'history') p.delete('view');
    else p.set('view', 'history');
    setSp(p);
  };
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
        <div className="bar-titles">
          <div className="bar-title">{mode === 'history' ? 'Program history' : 'Program'}</div>
          <div className="bar-sub">{client.name}</div>
        </div>
        <button
          className={`iconbtn${mode === 'history' ? ' on' : ''}`}
          onClick={toggleMode}
          aria-label={mode === 'history' ? 'Back to current program' : 'View program history'}
        >
          <History />
        </button>
      </div>

      {mode === 'history' ? (
        <ProgramHistory client={client} exercises={list} history={history} log={log} />
      ) : (
        <>
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
                    {week === curWk && d === todayWeekday() && <span className="day-today">today</span>}
                  </button>
                ))}
              </div>
              {dayProgLabels(list, day).length ? (
                dayProgLabels(list, day).map((prog) => (
                  <ReadOnlySlot
                    key={prog}
                    prog={prog}
                    exercises={exForDayProg(list, day, prog)}
                    sets={client.program?.sets?.[prog] ?? ROUNDS}
                    week={week}
                  />
                ))
              ) : (
                <div className="empty">
                  <div className="em">🏋️</div>
                  <p>No exercises for {day} yet. Tap below to build the program.</p>
                </div>
              )}
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
              <button className="bigbtn ghost" onClick={openEdit}>
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
